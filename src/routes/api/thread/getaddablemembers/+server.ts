import { supabase } from "$lib/server/supabase_client.server";
import type { RequestEvent } from "./$types";

export async function POST({
  request,
  cookies,
  locals,
}: RequestEvent): Promise<Response> {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify("you must be logged in to view addable thread members"), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 401,
    });
  }
  // console.log(session);
  const thread_info = await request.json();
  // console.log("inside add key",key_info);
  let given_threadid = thread_info.given_threadid;

  let { data:result, error:_error } = await supabase
  .rpc('get_thread_addable_member_list', { 
    given_threadid
  })

  // console.log("add key rps result",result)
  if (_error) {
    console.log("ERROR @api/thread/getaddablemembers:30: supabase get addable thread members error\n", _error)
    return new Response(JSON.stringify("internal server error while getting addable thread members: " + _error), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }

  let response: Response = new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}
