import { supabase } from "$lib/server/supabase_client.server";
import type { RequestEvent } from "./$types";

export async function POST({
  request,
  cookies,
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
  // console.log(session);
  const thread_info = await request.json();
  // console.log("inside add key",key_info);
  let given_description = thread_info.description;
  let given_parent_teamid = thread_info.given_parent_teamid;
  let given_threadname = thread_info.given_threadname;
  // let uid_list = thread_info.uid_list;
  // let sign_serial=0;
  let given_userid = session.user.name;

  let { data: result, error: _error } = await supabase.rpc("create_thread", {
    given_description,
    given_parent_teamid,
    given_threadname,
    given_userid,
  });

  // console.log("add key rps result",result)
  if (_error) {
    console.log(
      "ERROR @api/user/addkey:33: supabase add user publickey error\n",
      _error
    );
    return new Response(
      JSON.stringify("internal server error while adding user key: " + _error),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
  let response: Response = new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}
