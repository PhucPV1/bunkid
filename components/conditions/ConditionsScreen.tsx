import Link from "next/link";
import { CONDITIONS, type ConditionArticle } from "@/lib/content/conditions";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm bé tại nhà" },
  { key: "seeDoctor", title: "Nên cho bé đi khám" },
];

export function ConditionsScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{CONDITIONS.title}</h1>
      <p>{CONDITIONS.intro}</p>
      <div className="flex gap-2">
        <Link
          href="/trieu-chung"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border px-3"
        >
          Phân loại triệu chứng
        </Link>
        <a
          href="tel:115"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-alarm px-3 font-semibold text-on-accent"
        >
          Gọi 115
        </a>
      </div>
      <div className="flex flex-col gap-2">
        {CONDITIONS.articles.map((article) => (
          <Article key={article.code} article={article} />
        ))}
      </div>
      <p className="text-sm text-muted">{CONDITIONS.disclaimer}</p>
    </main>
  );
}

function Article({ article }: { article: ConditionArticle }) {
  return (
    <details id={article.code} className="rounded-2xl border">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
        {article.title}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <p>{article.summary}</p>
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h2 className="font-medium">{section.title}</h2>
            <ul className="list-disc pl-5">
              {article[section.key].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-xl bg-danger-soft p-3 text-danger-ink">
          <h2 className="font-semibold">Khi nào đi khám ngay</h2>
          <ul className="list-disc pl-5">
            {article.goNow.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <p className="text-sm text-muted">
          Thường kéo dài: {article.usualCourse}
        </p>
        <p className="text-sm text-muted">
          Nguồn:{" "}
          <a
            href={article.source}
            className="inline-flex min-h-11 items-center underline"
            target="_blank"
            rel="noreferrer"
          >
            NHS
          </a>{" "}
          (xem lại {article.reviewedAt.split("-").reverse().join("/")})
        </p>
      </div>
    </details>
  );
}
