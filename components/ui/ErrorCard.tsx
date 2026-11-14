import { Button } from "./Button";
import { Glass } from "./Glass";

// Spec §10: loading failed — a glass card with a danger border and a retry button.
export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Glass
      role="alert"
      className="flex flex-col items-start gap-3 border-danger! p-4"
    >
      <p className="text-[15px] text-ink">{message}</p>
      <Button variant="secondary" size="md" onClick={onRetry}>
        Thử lại
      </Button>
    </Glass>
  );
}
