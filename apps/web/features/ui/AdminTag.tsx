import React from "react";

function AdminTag({ isAdmin = false }: { isAdmin: boolean }) {
  return (
    <div>
      {isAdmin && (
        <span className="text-[10px] text-white bg-[--300-primary] px-2 py-1 rounded-lg whitespace-nowrap">Admin</span>
      )}
    </div>
  );
}

export default AdminTag;
