import { useEffect } from "react";

export default function VisibilityMessages(messageRefs, onVisibleMessages) {
    useEffect(() => {
        if (!messageRefs || !Object.values(messageRefs.current).length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleMessageIds = entries
                    .filter(entry => entry.isIntersecting)
                    .map(entry => entry.target.dataset.id);

                if (visibleMessageIds.length) {
                    onVisibleMessages(visibleMessageIds);
                }
            },
            { threshold: 1.0 }
        );

        Object.values(messageRefs.current).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => {
            Object.values(messageRefs.current).forEach(ref => {
                if (ref.current) observer.unobserve(ref.current);
            });
        };
    }, [messageRefs, onVisibleMessages]);
}