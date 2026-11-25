import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { CONDITIONS, type ConditionArticle } from "@/lib/content/conditions";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm bé tại nhà" },
  { key: "seeDoctor", title: "Nên cho bé đi khám" },
];

export function ConditionsScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={CONDITIONS.title}
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
      />
      <p className="px-1 text-base text-ink">{CONDITIONS.intro}</p>
      <div className="flex flex-col gap-2.5">
        <Link
          href="/trieu-chung"
          className={buttonClass({
            variant: "secondary",
            size: "md",
            block: true,
          })}
        >
          Phân loại triệu chứng
        </Link>
        <a
          href="tel:115"
          className={buttonClass({
            variant: "danger",
            size: "md",
            block: true,
          })}
        >
          <Icon name="phone" size={18} />
          Gọi 115
        </a>
      </div>
      <div className="flex flex-col gap-2.5">
        {CONDITIONS.articles.map((article) => (
          <Article key={article.code} article={article} />
        ))}
      </div>
      <p className="px-1 text-[13px] text-muted">{CONDITIONS.disclaimer}</p>
    </main>
  );
}

function Article({ article }: { article: ConditionArticle }) {
  return (
    <details
      id={article.code}
      className="group glass overflow-hidden rounded-[22px]"
    >
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {article.title}
        <Icon
          name="chevronRight"
          size={16}
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90"
        />
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-base text-ink">
        <p>{article.summary}</p>
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h3 className="text-[15px] font-semibold">{section.title}</h3>
            <ul className="list-disc pl-5">
              {article[section.key].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-[16px] bg-danger-soft p-3 text-danger-ink">
          <h3 className="font-semibold">Khi nào đi khám ngay</h3>
          <ul className="list-disc pl-5">
            {article.goNow.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <p className="text-[13px] text-muted">
          Thường kéo dài: {article.usualCourse}
        </p>
        <p className="text-[13px] text-muted">
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
