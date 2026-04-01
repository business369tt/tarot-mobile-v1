import { TarotFlowGate } from "@/components/flow/tarot-flow-gate";
import { ReadingScreen } from "@/components/flow/reading-screen";

export default function ReadingPage() {
  return (
    <TarotFlowGate requiredStep="reading">
      <ReadingScreen />
    </TarotFlowGate>
  );
}
