import { prisma } from "@/lib/prisma";
import { mapRecordToFollowupRecord } from "@/lib/followup-record";
import { getCategoryMeta } from "@/lib/mock-tarot-data";
import {
  buildReadingSections,
  mapRecordToReadingRecord,
} from "@/lib/reading-record";

const historyDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const historyDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

async function getHistoryListQueryRecords(viewerId: string) {
  return prisma.readingRecord.findMany({
    where: {
      userId: viewerId,
      status: "ready",
      session: {
        is: {
          ownerId: viewerId,
          saveToHistory: true,
        },
      },
    },
    include: {
      followupRecords: {
        where: {
          userId: viewerId,
          status: "ready",
        },
        select: {
          id: true,
          costPoints: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

async function getHistoryDetailQueryRecord(viewerId: string, recordId: string) {
  return prisma.readingRecord.findFirst({
    where: {
      id: recordId,
      userId: viewerId,
      status: "ready",
      session: {
        is: {
          ownerId: viewerId,
          saveToHistory: true,
        },
      },
    },
    include: {
      followupRecords: {
        where: {
          userId: viewerId,
          status: "ready",
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

type HistoryListQueryRecord = Awaited<
  ReturnType<typeof getHistoryListQueryRecords>
>[number];

type HistoryDetailQueryRecord = Awaited<
  ReturnType<typeof getHistoryDetailQueryRecord>
>;

export type HistoryListItem = {
  id: string;
  question: string;
  category: string;
  categoryLabel: string;
  categoryDescription: string;
  cardsSummary: Array<{
    id: string;
    name: string;
    orientation: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdLabel: string;
  updatedLabel: string;
  followupCount: number;
  hasFollowup: boolean;
  reportTitle: string | null;
  totalSpentPoints: number;
};

export type HistoryDetailRecord = {
  reading: ReturnType<typeof mapRecordToReadingRecord>;
  followups: ReturnType<typeof mapRecordToFollowupRecord>[];
  categoryLabel: string;
  categoryDescription: string;
  readingSections: ReturnType<typeof buildReadingSections>;
  createdLabel: string;
  updatedLabel: string;
  followupCount: number;
  totalSpentPoints: number;
  readingSpentPoints: number;
  followupSpentPoints: number;
};

function formatHistoryDate(value: Date) {
  return historyDateFormatter.format(value);
}

function formatHistoryDateTime(value: Date) {
  return historyDateTimeFormatter.format(value);
}

function mapListItem(record: HistoryListQueryRecord): HistoryListItem {
  const reading = mapRecordToReadingRecord(record);
  const categoryMeta = getCategoryMeta(reading.category);
  const followupCount = record.followupRecords.length;
  const followupSpentPoints = record.followupRecords.reduce(
    (sum, followup) => sum + followup.costPoints,
    0,
  );

  return {
    id: reading.id,
    question: reading.question,
    category: reading.category,
    categoryLabel: categoryMeta.label,
    categoryDescription: categoryMeta.description,
    cardsSummary: reading.cardsSnapshot.map((card) => ({
      id: card.id,
      name: card.name,
      orientation: card.orientation === "upright" ? "Upright" : "Reversed",
    })),
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
    createdLabel: formatHistoryDate(new Date(reading.createdAt)),
    updatedLabel: formatHistoryDateTime(new Date(reading.updatedAt)),
    followupCount,
    hasFollowup: followupCount > 0,
    reportTitle: reading.fullReading?.reportTitle ?? null,
    totalSpentPoints: reading.costPoints + followupSpentPoints,
  };
}

function mapDetailRecord(record: NonNullable<HistoryDetailQueryRecord>): HistoryDetailRecord {
  const reading = mapRecordToReadingRecord(record);
  const followups = record.followupRecords.map(mapRecordToFollowupRecord);
  const categoryMeta = getCategoryMeta(reading.category);
  const followupSpentPoints = followups.reduce(
    (sum, followup) => sum + followup.costPoints,
    0,
  );

  return {
    reading,
    followups,
    categoryLabel: categoryMeta.label,
    categoryDescription: categoryMeta.description,
    readingSections: buildReadingSections(reading),
    createdLabel: formatHistoryDateTime(new Date(reading.createdAt)),
    updatedLabel: formatHistoryDateTime(new Date(reading.updatedAt)),
    followupCount: followups.length,
    totalSpentPoints: reading.costPoints + followupSpentPoints,
    readingSpentPoints: reading.costPoints,
    followupSpentPoints,
  };
}

export async function getViewerHistoryList(viewerId: string) {
  const records = await getHistoryListQueryRecords(viewerId);

  return records.map(mapListItem);
}

export async function getViewerHistoryDetail(
  viewerId: string,
  recordId: string,
) {
  const record = await getHistoryDetailQueryRecord(viewerId, recordId);

  return record ? mapDetailRecord(record) : null;
}
