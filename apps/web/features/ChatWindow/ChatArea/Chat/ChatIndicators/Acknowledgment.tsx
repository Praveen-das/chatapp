import { IMessageReadReceipt } from "enums/enums";

const Acknowledgment = ({
  readReceipt,
}: {
  readReceipt?: string | IMessageReadReceipt;
}) => {
  if (readReceipt === "seen")
    return (
      <div className={`flex`}>
        <div
          className={`size-[6px] rounded-full bg-primary -translate-x-[2px]`}
        />
        <div className={`size-[6px] rounded-full bg-primary`} />
      </div>
    );
  if (readReceipt === "received" || readReceipt === "unseen")
    return (
      <div className={`flex`}>
        <div
          className={`size-[6px] rounded-full bg-black/50 -translate-x-[2px]`}
        />
        <div className={`size-[6px] rounded-full bg-black/50`} />
      </div>
    );
  return <div className={`size-[6px] rounded-full bg-black/50`} />;
};

export default Acknowledgment;
