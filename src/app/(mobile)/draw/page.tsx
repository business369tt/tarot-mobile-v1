import { TarotFlowGate } from "@/components/flow/tarot-flow-gate";
import { DrawScreen } from "@/components/flow/draw-screen";

export default function DrawPage() {
  return (
    <TarotFlowGate requiredStep="draw">
      <DrawScreen />
    </TarotFlowGate>
  );
}
