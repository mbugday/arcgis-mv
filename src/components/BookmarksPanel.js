import React, { useEffect, useRef } from "react";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";

const BookmarksPanel = ({ view, activePanel }) => {
  const containerRef = useRef(null);
  const widgetDivRef = useRef(null);
  const bookmarksRef = useRef(null);

  useEffect(() => {
    if (!view || activePanel !== "bookmarks-panel" || !containerRef.current) return;

    const container = containerRef.current;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    container.appendChild(widgetDiv);
    widgetDivRef.current = widgetDiv;

    const bookmarks = new Bookmarks({
      view,
      container: widgetDiv,
      visibleElements: {
        addBookmarkButton: true,
        editBookmarkButton: true,
      }
    });

    bookmarksRef.current = bookmarks;

    return () => {
      if (bookmarksRef.current) {
        bookmarksRef.current.destroy();
        bookmarksRef.current = null;
      }
      if (container.contains(widgetDiv)) {
        container.removeChild(widgetDiv);
      }
    };
  }, [view, activePanel]);

  return (
    <div className="panel-content">
      <div ref={containerRef} />
    </div>
  );
};

export default BookmarksPanel;