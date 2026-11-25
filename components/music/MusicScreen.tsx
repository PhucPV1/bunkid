"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { MUSIC_PRESETS, type MusicCategory } from "@/lib/content/music";
import { toVietnameseError } from "@/lib/data/errors";
import { useMusicActions, useMusicLinks } from "@/lib/data/music";
import { useOnline } from "@/lib/hooks/useOnline";
import { useYouTubeOpener } from "@/lib/hooks/useYouTubeOpener";
import {
  BRAIN_NOTE,
  musicItems,
  parseLinkTitle,
  type MusicItem,
} from "@/lib/rules/music";
import { parseYouTubeUrl, webUrl, youtubePath } from "@/lib/rules/youtube";
import { YouTubeModePicker } from "./YouTubeModePicker";

const TABS: { value: MusicCategory; label: string }[] = [
  { value: "relax", label: "Thư giãn / ru ngủ" },
  { value: "brain", label: "Phát triển trí não" },
];

export function MusicScreen({
  familyId,
  userId,
  isOwner,
}: {
  familyId: string;
  userId: string;
  isOwner: boolean;
}) {
  const links = useMusicLinks(familyId);
  const actions = useMusicActions(familyId);
  // Hiding and deleting need the network (spec gốc §9); the add form says so once.
  const online = useOnline();
  const youtube = useYouTubeOpener();
  const [tab, setTab] = useState<MusicCategory>("relax");
  const [showHidden, setShowHidden] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const items = musicItems({
    presets: MUSIC_PRESETS,
    links: links.data ?? [],
    category: tab,
  });
  const hiddenCount = items.filter((item) => item.hidden).length;
  const showing = showHidden && hiddenCount > 0;
  const visible = items.filter((item) => showing || !item.hidden);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));

  function toggleHidden(item: MusicItem) {
    setMessage(null);
    if (item.kind === "preset")
      actions.setPresetHidden.mutate(
        {
          presetCode: item.preset.presetCode,
          category: item.preset.category,
          hidden: !item.hidden,
        },
        { onError },
      );
    else
      actions.setLinkHidden.mutate(
        { id: item.link.id, hidden: !item.hidden },
        { onError },
      );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Nhạc cho bé"
        back={{ href: "/tien-ich", label: "Tiện ích" }}
      />
      <Segmented
        label="Loại nhạc"
        options={TABS}
        value={tab}
        onChange={setTab}
      />
      <YouTubeModePicker mode={youtube.mode} onChange={youtube.setMode} />
      {tab === "brain" && (
        <p className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink">
          {BRAIN_NOTE}
        </p>
      )}
      {!online && (
        <p role="status" className="px-1 text-[13px] text-muted">
          Cần kết nối mạng để ẩn, hiện lại hoặc xóa.
        </p>
      )}
      <ListGroup>
        {visible.map((item) => {
          const path = youtubePath(item.target);
          const canDelete =
            item.kind === "link" &&
            (isOwner || item.link.created_by === userId);
          return (
            <li
              key={item.key}
              className="flex flex-col gap-1 border-b border-line px-4 py-2 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => youtube.open(path)}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cat-sleep/15 text-cat-sleep">
                    <Icon name="play" size={16} filled />
                  </span>
                  <span
                    className={`text-base font-medium ${item.hidden ? "text-muted" : "text-ink"}`}
                  >
                    {item.title}
                  </span>
                </button>
                <a
                  href={webUrl(path)}
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-accent-text"
                >
                  Mở trên web
                </a>
              </div>
              <div className="flex gap-1 pl-12">
                <Button
                  variant="ghost"
                  size="md"
                  disabled={!online}
                  onClick={() => toggleHidden(item)}
                >
                  {item.hidden ? "Hiện lại" : "Ẩn"}
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="md"
                    disabled={!online}
                    className="text-danger!"
                    onClick={() => {
                      if (window.confirm(`Xóa "${item.title}"?`)) {
                        setMessage(null);
                        actions.remove.mutate(item.link.id, { onError });
                      }
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ListGroup>
      {hiddenCount > 0 && (
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowHidden(!showing)}
        >
          {showing ? "Ẩn các mục đã ẩn" : `Hiện các mục đã ẩn (${hiddenCount})`}
        </Button>
      )}
      {message && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {message}
        </p>
      )}
      <AddLinkForm category={tab} familyId={familyId} />
      {links.isError && !links.data && (
        <ErrorCard
          message={toVietnameseError(links.error)}
          onRetry={() => void links.refetch()}
        />
      )}
    </main>
  );
}

function AddLinkForm({
  category,
  familyId,
}: {
  category: MusicCategory;
  familyId: string;
}) {
  const actions = useMusicActions(familyId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const target = url.trim() === "" ? null : parseYouTubeUrl(url);
  // Spec gốc §6.11: an invalid link is reported right at the input.
  const urlError =
    url.trim() !== "" && !target ? "Link YouTube không hợp lệ." : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedTitle = parseLinkTitle(title);
    if (!target) {
      setError("Dán link YouTube của bài hát hoặc danh sách phát.");
      return;
    }
    if (parsedTitle === "too_long") {
      setError("Tên tối đa 80 ký tự.");
      return;
    }
    setError(null);
    actions.add.mutate(
      { category, title: parsedTitle, target },
      {
        onSuccess: () => {
          setUrl("");
          setTitle("");
        },
        onError: (e) => setError(toVietnameseError(e)),
      },
    );
  }

  return (
    <OnlineOnly>
      {/* noValidate: links without https:// are accepted (spec gốc §6.11). */}
      <form
        noValidate
        onSubmit={submit}
        className="glass flex flex-col gap-3 rounded-[28px] p-4"
      >
        <h2 className="text-[17px] font-semibold text-ink">
          Thêm link YouTube
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Link</span>
          <input
            type="url"
            inputMode="url"
            className={FIELD_INPUT}
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {urlError && (
            <span className="text-[13px] text-danger">{urlError}</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Tên (không bắt buộc)</span>
          <input
            className={FIELD_INPUT}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" block busy={actions.add.isPending}>
          Thêm vào {category === "relax" ? "Thư giãn" : "Phát triển trí não"}
        </Button>
      </form>
    </OnlineOnly>
  );
}
