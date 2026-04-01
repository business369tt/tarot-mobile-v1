import { TarotFlowGate } from "@/components/flow/tarot-flow-gate";
import { RitualScreen } from "@/components/flow/ritual-screen";

export default function RitualPage() {
  return (
    <TarotFlowGate requiredStep="ritual">
      <RitualScreen />
    </TarotFlowGate>
  );
}
