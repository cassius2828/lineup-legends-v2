export type PostJsonError = {
  ok: false;
  status: number;
  error?: string;
  message?: string;
  code?: string;
};

export type PostJsonSuccess<T> = { ok: true; data: T };

export async function postJson<T>(
  url: string,
  body: unknown,
): Promise<PostJsonSuccess<T> | PostJsonError> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const parsed = (await res.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: typeof parsed.error === "string" ? parsed.error : undefined,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      code: typeof parsed.code === "string" ? parsed.code : undefined,
    };
  }

  return { ok: true, data: parsed as T };
}
