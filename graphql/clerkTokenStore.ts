import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { wireTokenGetter } from "./links";

export function WireClerk() {
  const { getToken } = useAuth();
  React.useEffect(() => {
    // update the function the link calls, but don't rebuild anything
    wireTokenGetter(() => getToken()); // or just getToken
  }, [getToken]);
  return null;
}