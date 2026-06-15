function ConversationSkeleton(): React.JSX.Element {
  return (
    <div
      className={`flex gap-4 items-center w-full max-sm:py-2 max-sm:pr-2 sm:px-4 sm:min-h-[75px] rounded-2xl`}
    >
      <div className="skeleton bg-[--base-200-300] h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 w-full space-y-2">
        <div className="skeleton bg-[--base-200-300] h-3.5 w-1/4"></div>
        <div className="skeleton bg-[--base-200-300] h-3 w-3/4"></div>
      </div>
    </div>
  );
}

export default ConversationSkeleton;
