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

// Like hostElements, but matches any element (host or component) and also looks inside
// element-valued props such as ListRow's `trailing`. Components are still not called.
export function findElements(
  node: ReactNode,
  predicate: (element: ReactElement<TreeProps>) => boolean,
): ReactElement<TreeProps>[] {
  const found: ReactElement<TreeProps>[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (!isValidElement<TreeProps>(n)) return;
    if (predicate(n)) found.push(n);
    for (const value of Object.values(n.props)) visit(value);
  };
  visit(node);
  return found;
}
