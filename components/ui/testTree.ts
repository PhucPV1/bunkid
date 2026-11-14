import { isValidElement, type ReactElement, type ReactNode } from "react";

export type TreeProps = Record<string, unknown> & { children?: ReactNode };

// Walks the elements a hook-free component returns and collects host elements of one tag.
// Child components (e.g. <Icon />) are not expanded.
export function hostElements(
  node: ReactNode,
  tag: string,
): ReactElement<TreeProps>[] {
  const found: ReactElement<TreeProps>[] = [];
  const visit = (n: ReactNode): void => {
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (!isValidElement<TreeProps>(n)) return;
    if (n.type === tag) found.push(n);
    visit(n.props.children);
  };
  visit(node);
  return found;
}
