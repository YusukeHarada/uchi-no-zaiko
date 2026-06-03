import { ExpirationTips } from "@/components/inventory/expiration-tips";

export default function TipsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">保存方法のTips</h1>
      <ExpirationTips />
    </div>
  );
}
