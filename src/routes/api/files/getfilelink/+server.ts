import { supabase } from "$lib/server/supabase_client.server";
import type { RequestEvent } from "./$types";

export async function POST({
  request,
  locals,
}: RequestEvent): Promise<Response> {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify("you must be logged in to add files"), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 401,
    });
  }
  const file_info = await request.json();
  // console.log(key_info);
  let given_fileid = file_info.fileid;
  let given_userid = file_info.user_id;

  let { data: result1, error: _error1 } = await supabase.rpc(
    "get_single_filemetadata_fileid",
    {
      given_fileid,
      given_userid,
    }
  );
  if (_error1) {
    return new Response(
      JSON.stringify(
        "internal server error while getting file metadata: " + _error1
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
  const { data: result2, error: _error2 } = await supabase.storage
    .from("user_personal_files")
    .createSignedUrl(result1.file_url, 24 * 60 * 60);

  if (_error2) {
    return new Response(
      JSON.stringify(
        "internal server error while getting preview link: " + _error2
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }

  const { data: result3, error: _error3 } = await supabase.storage
    .from("user_personal_files")
    .createSignedUrl(result1.file_url, 24 * 60 * 60, {
      download: result1.filename,
    });

  if (_error3) {
    return new Response(
      JSON.stringify(
        "internal server error while getting downloadable link: " + _error3
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }

  let response: Response = new Response(
    JSON.stringify({
      file_link_preview: result2?.signedUrl,
      file_link_download: result3?.signedUrl,
      file_data: result1,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response;
}
