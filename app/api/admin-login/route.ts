export async function POST(req: Request) {
  const { password } = await req.json()

  if (password === process.env.ADMIN_PASSWORD) {
    return Response.json({ success: true })
  }

  return Response.json({ success: false }, { status: 401 })
}