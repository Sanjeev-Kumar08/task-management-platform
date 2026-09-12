type WithMongoId = { _id?: unknown; id?: string };

export function normalizeId<T extends WithMongoId>(doc: T): T & { id: string } {
  const id = doc.id ?? (doc._id !== undefined && doc._id !== null ? String(doc._id) : undefined);
  if (!id) {
    throw new Error('Document missing id');
  }
  return { ...doc, id };
}

export function normalizeList<T extends WithMongoId>(docs: T[]): Array<T & { id: string }> {
  return docs.map((d) => normalizeId(d));
}

export function asUserRef(
  value:
    string | { id?: string; _id?: unknown; name?: string; email?: string; avatar?: string | null },
) {
  if (typeof value === 'string') return { id: value, name: 'User', email: '', avatar: null };
  return {
    id: value.id ?? (value._id !== undefined ? String(value._id) : ''),
    name: value.name ?? 'User',
    email: value.email ?? '',
    avatar: value.avatar ?? null,
  };
}
