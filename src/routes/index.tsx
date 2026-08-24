import { createFileRoute } from "@tanstack/react-router";
import { VoiceApp } from "@/components/voice/voice-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VoiceApp />;
}
