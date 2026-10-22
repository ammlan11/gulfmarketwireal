"use client";

import { useState } from "react";
import type { NewsArticle } from "@/types/news";
import styles from "./LiveTVLanding.module.scss";

type Props = {
  articles: NewsArticle[];
};

const liveStreams = [
  {
    id: "stream-1",
    title: "Global Markets & Business Live",
    channel: "Bloomberg Television",
    videoId: "QB5BNdBFujE",
  },
  {
    id: "stream-2",
    title: "Finance & Markets Live",
    channel: "Yahoo Finance",
    videoId: "KQp-e_XQnDE",
  },
  {
    id: "stream-3",
    title: "Business & Economy Live",
    channel: "Business News",
    videoId: "GotlA1KKWoo",
  },
  {
    id: "stream-4",
    title: "Global Business Live",
    channel: "Live Business",
    videoId: "gCNeDWCI0vo",
  },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 60) {
    return `${Math.max(mins, 1)}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function LiveTVLanding({ articles }: Props) {
  const latest = articles.slice(0, 8);

  const [selectedStream, setSelectedStream] = useState(liveStreams[0]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* PAGE TITLE */}
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.liveDot} />

            <span className={styles.liveLabel}>LIVE</span>
          </div>

          <h1>Live TV</h1>

          <p>
            Live coverage of global markets, finance, economics and technology.
          </p>
        </header>

        {/* LIVE PLAYER */}
        <section className={styles.liveSection}>
          <div className={styles.playerColumn}>
            <div className={styles.player}>
              <iframe
                key={selectedStream.videoId}
                src={`https://www.youtube.com/embed/${selectedStream.videoId}?autoplay=1&mute=1&playsinline=1`}
                title={selectedStream.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>

            <div className={styles.liveInfo}>
              <div className={styles.liveBadge}>
                <span />
                LIVE NOW
              </div>

              <h2>{selectedStream.title}</h2>

              <p>
                Breaking financial news, market moves, economic developments and
                technology coverage.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE LATEST */}
          <aside className={styles.latest}>
            <div className={styles.latestHeader}>
              <h2>Latest</h2>

              <span>
                <i />
                LIVE
              </span>
            </div>

            {latest.map((article) => (
              <article key={article.id}>
                <small>{timeAgo(article.publishedAt)}</small>

                <a href={`/news/${encodeURIComponent(article.id)}`}>
                  <h3>{article.title}</h3>
                </a>

                <span>{article.source}</span>
              </article>
            ))}
          </aside>
        </section>

        {/* STREAMING NOW */}
        <section className={styles.streamingSection}>
          <div className={styles.streamingHeader}>
            <h2>Streaming Now</h2>

            <span>Explore More →</span>
          </div>

          <div className={styles.streamingGrid}>
            {liveStreams
              .filter((stream) => stream.id !== selectedStream.id)
              .map((stream) => (
                <button
                  type="button"
                  key={stream.id}
                  className={styles.streamCard}
                  onClick={() => {
                    setSelectedStream(stream);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                >
                  <div className={styles.streamThumbnail}>
                    <img
                      src={`https://img.youtube.com/vi/${stream.videoId}/maxresdefault.jpg`}
                      alt={stream.title}
                    />

                    <div className={styles.liveBadgeCard}>
                      <span />
                      Live
                    </div>

                    <div className={styles.playButtonSmall}>▶</div>
                  </div>

                  <div className={styles.streamDetails}>
                    <span>{stream.channel}</span>

                    <h3>{stream.title}</h3>
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* MORE NEWS */}
        <section className={styles.moreNews}>
          <h2>More News</h2>

          {latest.map((article) => (
            <article key={`more-${article.id}`}>
              <div>
                <span>{article.source}</span>

                <a href={`/news/${encodeURIComponent(article.id)}`}>
                  <h3>{article.title}</h3>
                </a>
              </div>

              {article.imageUrl && (
                <img src={article.imageUrl} alt={article.title} />
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
