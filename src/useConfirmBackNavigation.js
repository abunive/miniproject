import { useEffect } from "react";

export default function useConfirmBackNavigation(message) {
  useEffect(() => {
    // Push a dummy history state
    window.history.pushState(null, "", window.location.href);

    const handleBackButton = () => {
      const confirmLeave = window.confirm(
        message || "Do you really want to go back?"
      );

      if (confirmLeave) {
        window.removeEventListener("popstate", handleBackButton);
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [message]);
}
