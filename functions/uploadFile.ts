Deno.serve(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const APP_ID = Deno.env.get("BASE44_APP_ID")!;
    const SERVICE_TOKEN = Deno.env.get("BASE44_SERVICE_TOKEN")!;

    const uploadForm = new FormData();
    uploadForm.append('file', file, file.name);

    const uploadRes = await fetch(
      `https://base44.app/api/apps/${APP_ID}/integration-endpoints/Core/UploadFile`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERVICE_TOKEN}` },
        body: uploadForm,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: `Upload failed (${uploadRes.status}): ${errText}` }, { status: 500 });
    }

    const data = await uploadRes.json();
    return Response.json({ file_url: data.file_url });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
