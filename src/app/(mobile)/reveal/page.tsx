import { TarotFlowGate } from "@/components/flow/tarot-flow-gate";
import { RevealScreen } from "@/components/flow/reveal-screen";

export default function RevealPage() {
  return (
    <TarotFlowGate requiredStep="reveal">
      <RevealScreen />
    </TarotFlowGate>
  );
}
