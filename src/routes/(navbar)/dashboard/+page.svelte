<script lang="ts">
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";
  import FileCard from "$lib/components/dashboard/file-card.svelte";
  import OrgCard from "$lib/components/dashboard/org-card.svelte";
  import TeamCard from "$lib/components/dashboard/team-card.svelte";
  import ThreadCard from "$lib/components/dashboard/thread-card.svelte";
  import { common_fetch } from "$lib/fetch_func";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { db, type PriveKey } from "$lib/db";
  import { logged_in_store, priv_key, uid, useremail } from "../../../stores";

  /**
   * Whether profile edit mode active or not, toggled by button named "Edit Profile"
   */
  let profile_edit_mode: boolean = false;
  let username: string = "";
  let email: string = "";
  let pubkey: string =
    "";
  let privkey: string =
    "";
  /**
   * Visibility/truncated state of public key
   */
  let pubkey_truncate_status: string = "truncate";
  /**
   * Visibility/truncated state of private key
   */
  let privkey_visible: boolean = false;
  let pubkey_p: HTMLParagraphElement;
  let privkey_p: HTMLParagraphElement;
  /**
   * Decides which tab to show according to these values:
   *
   * 0 -> personal files
   *
   * 1 -> work files
   *
   * 2 -> organizations
   *
   * 3 -> teams
   *
   * 4 -> threads
   */
  let tab_index: number = 0;

  /**
   * This class helps to set tab properties and their functionalities easily 👉👈
   */
  class Tab {
    public name!: string;
    /**
     * this callback is supposed to set tab_index
     */
    public callback!: () => void;
  }

  let tabs: Tab[] = [
    {
      name: "Personal Files",
      callback: (): void => {
        tab_index = 0;
      },
    },
    {
      name: "Work Files",
      callback: (): void => {
        tab_index = 1;
      },
    },
    {
      name: "Organizations",
      callback: (): void => {
        tab_index = 2;
      },
    },
    {
      name: "Teams",
      callback: (): void => {
        tab_index = 3;
      },
    },
    {
      name: "Threads",
      callback: (): void => {
        tab_index = 4;
      },
    },
  ];

  /**
   * toggle to profile edit mode
   */
  function edit_profile(): void {
    profile_edit_mode = true;
  }

  /**
   * save profile to db after edit
   */
  function save_profile(): void {
    profile_edit_mode = false;
  }

  /**
   * toggle public key visibility
   */
  function switch_pubkey_truncate(): void {
    if (pubkey_truncate_status === "truncate") {
      pubkey_truncate_status = "";
    } else {
      pubkey_truncate_status = "truncate";
    }
  }

  /**
   * toggle private key visibility
   */
  function switch_privkey_visibility(): void {
    privkey_visible = !privkey_visible;
  }
  class File {
    public id!: string;
    public name!: string;
    public type!: string;
  }

  let personal_files: File[] = new Array(0);
  function get_personal_files(): void {
    let request_obj: any = {
      given_userid: $page.data.session?.user?.name,
    };

    common_fetch(
      "/api/files/getpersonalfiles",
      request_obj,
      async (response: Response): Promise<void> => {
        let response_obj: any = await response.json();

        personal_files = [];

        if (response_obj === null) {
          return;
        }

        for (let i: number = 0; i < response_obj.length; ++i) {
          personal_files[i] = new File();
          personal_files[i].id = response_obj[i].f_fileid;
          personal_files[i].name = response_obj[i].f_filename;
          personal_files[i].type = response_obj[i].f_file_extension;
        }
      }
    );
  }

  class Team {
    public name!: string;
    public id!: string;
  }

  let teams: Team[] = new Array(5);

  for (let i: number = 0; i < teams.length; ++i) {
    teams[i] = new Team();
    teams[i].name = "Team " + (i + 1).toString();
    teams[i].id = String(i);
  }

  /**
   * thread list item
   */
  class Thread {
    public name!: string;
    public id!: string;
  }

  let threads: Thread[] = new Array(10);
  function get_user_teams(): void {
    let request_obj: any = {
      given_userid: $page.data.session?.user?.name,
    };

    common_fetch(
      "/api/user/getteams",
      request_obj,
      async (response: Response): Promise<void> => {
        let response_obj: any = await response.json();

        teams = [];

        if (response_obj === null) {
          return;
        }
        console.log(response_obj);
        for (let i: number = 0; i < response_obj.length; ++i) {
            teams[i] = new Team();
            teams[i].name = response_obj[i].f_team_name;
            teams[i].id = response_obj[i].f_teamid;
            }
      }
    );
  }
  function get_user_all_threads(): void {
    let request_obj: any = {
      given_userid: $page.data.session?.user?.name,
    };

    common_fetch(
      "/api/user/getallthreads",
      request_obj,
      async (response: Response): Promise<void> => {
        let response_obj: any = await response.json();

        threads = [];

        if (response_obj === null) {
          return;
        }
        console.log(response_obj);
        for (let i: number = 0; i < response_obj.length; ++i) {
            threads[i] = new Thread();
            threads[i].name = response_obj[i].f_threadname;
            threads[i].id = response_obj[i].f_threadid;
            }
      }
    );
  }
  

  onMount((): void => {
    if ($page.data.session === null) {
        goto("/");

        return;
    } else {
        logged_in_store.set(true);
        uid.set($page.data.session?.user?.name as string)
        useremail.set($page.data.session?.user?.email as string)
    }

    get_personal_files();
    get_user_teams();
    get_user_all_threads();
    let request_obj: any = {
      userid: $page.data.session?.user?.name,
    };

    common_fetch(
      "/api/user/details",
      request_obj,
      async (response: Response): Promise<void> => {
        let response_obj: any = await response.json();
        // console.log(response_obj);
        username = response_obj.username;
        email = response_obj.email;
        // console.log(typeof response_obj.publickey);
        pubkey = [
          ...new Uint8Array(
            new TextEncoder().encode(JSON.stringify(response_obj.publickey))
          ),
        ]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        // console.log(pubkey);
        if ($page.data.session) {
          let temp_priv_key = await db.priv_key.get(
            $page.data.session.user?.name as string
          );
          if (temp_priv_key) {
            let subtle_crypto: SubtleCrypto = window.crypto.subtle;
            let private_key = await subtle_crypto.exportKey(
              "jwk",
              temp_priv_key.key
            );
            // console.log(private_key);
            privkey = [
              ...new Uint8Array(
                new TextEncoder().encode(JSON.stringify(private_key))
              ),
            ]
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");
          }
        }
      }
    );
  });
</script>

<!-- Dashboard card root div -->
<div
  class="dash-root flex block bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
  <!-- This segment shows the profile info and keys -->
  <div class="dash-left my-6 ps-6 pe-3">
    <!-- Pfp -->
    <div class="flex items-center">
      <img
        class="w-36 h-36 rounded-full"
        src="pochita.webp"
        alt="Rounded avatar"
      />

      {#if profile_edit_mode}
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a
          href="javascript:"
          class="inline-flex items-center font-medium text-blue-700 dark:text-blue-600 hover:underline ms-2"
        >
          <svg
            class="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z"
            />
            <path
              d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z"
            />
            <path
              d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z"
            />
          </svg>
        </a>
      {/if}
    </div>
    <!-- Username -->
    {#if profile_edit_mode}
      <p class="text-base font-medium text-gray-500 dark:text-gray-400 mt-2">
        Username
      </p>
      <input
        type="text"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-2 mb-6"
        bind:value={username}
        required
      />
    {:else}
      <p class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2 mb-6">
        {username}
      </p>
    {/if}
    <!-- Email ID -->
    <p class="text-base font-medium text-gray-500 dark:text-gray-400 mt-2">
      Email
    </p>
    {#if profile_edit_mode}
      <input
        type="text"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-2 mb-6"
        bind:value={email}
        required
      />
    {:else}
      <p class="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">
        {email}
      </p>
    {/if}
    <!-- Edit/save profile button -->
    {#if profile_edit_mode}
      <button
        type="button"
        class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
        on:click={save_profile}>Save</button
      >
    {:else}
      <button
        type="button"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        on:click={edit_profile}>Edit Profile</button
      >
    {/if}
    <!-- Public key -->
    <p class="text-base font-medium text-gray-500 dark:text-gray-400 mt-6">
      Public Key
    </p>
    <div class="flex items-start mb-2" style="max-width: 100%;">
      <p
        class="text-xl font-medium text-gray-700 dark:text-gray-200 {pubkey_truncate_status} mt-auto mb-auto"
        style="width: 80%; word-wrap: break-word;"
        bind:this={pubkey_p}
      >
        {pubkey}
      </p>
      <!-- Show/hide public key button -->
      <button
        type="button"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ms-2"
        on:click={switch_pubkey_truncate}
      >
        {#if pubkey_truncate_status === "truncate"}
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 14"
          >
            <path
              d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
            />
          </svg>
        {:else}
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="m2 13.587 3.055-3.055A4.913 4.913 0 0 1 5 10a5.006 5.006 0 0 1 5-5c.178.008.356.026.532.054l1.744-1.744A8.973 8.973 0 0 0 10 3C4.612 3 0 8.336 0 10a6.49 6.49 0 0 0 2 3.587Z"
            />
            <path
              d="m12.7 8.714 6.007-6.007a1 1 0 1 0-1.414-1.414L11.286 7.3a2.98 2.98 0 0 0-.588-.21l-.035-.01a2.981 2.981 0 0 0-3.584 3.583c0 .012.008.022.01.033.05.204.12.401.211.59l-6.007 6.007a1 1 0 1 0 1.414 1.414L8.714 12.7c.189.091.386.162.59.211.011 0 .021.007.033.01a2.981 2.981 0 0 0 3.584-3.584c0-.012-.008-.023-.011-.035a3.05 3.05 0 0 0-.21-.588Z"
            />
            <path
              d="M17.821 6.593 14.964 9.45a4.952 4.952 0 0 1-5.514 5.514L7.665 16.75c.767.165 1.55.25 2.335.251 6.453 0 10-5.258 10-7 0-1.166-1.637-2.874-2.179-3.407Z"
            />
          </svg>
        {/if}
      </button>
    </div>
    <!-- private key -->
    <p class="text-base font-medium text-gray-500 dark:text-gray-400">
      Private Key
    </p>
    <div class="flex items-start mb-4" style="max-width: 100%;">
      <p
        class="text-xl font-medium text-gray-700 dark:text-gray-200 mt-auto mb-auto"
        style="width: 80%; word-wrap: break-word;"
        bind:this={privkey_p}
      >
        {#if privkey_visible}
          {privkey}
        {:else}
          ●●●●●●●●●●
        {/if}
      </p>
      <!-- Show/hide private key button -->
      <button
        type="button"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ms-2"
        on:click={switch_privkey_visibility}
      >
        {#if privkey_visible}
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="m2 13.587 3.055-3.055A4.913 4.913 0 0 1 5 10a5.006 5.006 0 0 1 5-5c.178.008.356.026.532.054l1.744-1.744A8.973 8.973 0 0 0 10 3C4.612 3 0 8.336 0 10a6.49 6.49 0 0 0 2 3.587Z"
            />
            <path
              d="m12.7 8.714 6.007-6.007a1 1 0 1 0-1.414-1.414L11.286 7.3a2.98 2.98 0 0 0-.588-.21l-.035-.01a2.981 2.981 0 0 0-3.584 3.583c0 .012.008.022.01.033.05.204.12.401.211.59l-6.007 6.007a1 1 0 1 0 1.414 1.414L8.714 12.7c.189.091.386.162.59.211.011 0 .021.007.033.01a2.981 2.981 0 0 0 3.584-3.584c0-.012-.008-.023-.011-.035a3.05 3.05 0 0 0-.21-.588Z"
            />
            <path
              d="M17.821 6.593 14.964 9.45a4.952 4.952 0 0 1-5.514 5.514L7.665 16.75c.767.165 1.55.25 2.335.251 6.453 0 10-5.258 10-7 0-1.166-1.637-2.874-2.179-3.407Z"
            />
          </svg>
        {:else}
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 14"
          >
            <path
              d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
            />
          </svg>
        {/if}
      </button>
    </div>
    <!-- Regenerate keys button -->
    <button
      type="button"
      class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    >Regenerate Keys</button
    >
  </div>
  <!-- This segment shows various lists like files orgs etc -->
  <div class="dash-right my-6 ps-3 me-6">
    <!-- svelte-ignore a11y-invalid-attribute -->
    <ul
      class="tab-list flex justify-center text-sm font-medium text-center text-gray-500 dark:text-gray-400"
    >
      {#each tabs as tab, index}
        <li class="me-2">
          {#if tab_index === index}
            <a
              href="javascript:"
              class="inline-block px-4 py-3 text-white bg-blue-600 rounded-lg active"
              aria-current="page">{tab.name}</a
            >
          {:else}
            <a
              href="javascript:"
              class="inline-block px-4 py-3 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white"
              on:click={tab.callback}>{tab.name}</a
            >
          {/if}
        </li>
      {/each}
    </ul>
    <!-- Main content of each tab -->
    <div class="tab-content">
      <!-- <p
        class="tab-title text-2xl font-bold text-gray-900 dark:text-white mx-6 mt-6 ps-1"
      >
        {tabs[tab_index].name}
      </p> -->
      <!-- Each option of tab_index show each type of tab -->
      {#if tab_index === 0}
      <ul class="tab-content-list space-y-2 mt-2 mb-6 mx-6 pe-1 pb-1"
      style="overflow-y: auto;">
        {#each personal_files as file}
          <li>
            <FileCard
              file_id={file.id}
              file_name={file.name}
              file_type={file.type}
            />
          </li>
        {/each}
      </ul>
      {:else if tab_index === 1}
        <ul
          class="tab-content-list space-y-2 mb-6 mx-6 pb-2"
          style="overflow-y: auto;"
        >
          <li>
            <FileCard file_name={"Work File 1"} file_type={"png"} />
          </li>
          <li>
            <FileCard file_name={"Work File 2"} file_type={"jpg"} />
          </li>
          <li>
            <FileCard file_name={"Work File 3"} file_type={"jpg"} />
          </li>
          <li>
            <FileCard file_name={"Work File 4"} file_type={"pdf"} />
          </li>
        </ul>
      {:else if tab_index === 2}
        <ul
          class="tab-content-list space-y-2 mb-6 mx-6 pb-2"
          style="overflow-y: auto;"
        >
          <li>
            <OrgCard org_name={"Organization 1"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 2"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 3"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 4"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 5"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 6"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 7"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 8"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 9"} />
          </li>
          <li>
            <OrgCard org_name={"Organization 10"} />
          </li>
        </ul>
      {:else if tab_index === 3}
        <ul
          class="tab-content-list space-y-2 mb-6 mx-6 pb-2"
          style="overflow-y: auto;"
        >
        {#each teams as team}
        <li>
          <TeamCard 
          team_name={team.name}
          team_id={team.id}
          />
        </li>
      {/each}
        </ul>
      {:else if tab_index === 4}
        <ul
          class="tab-content-list space-y-2 mb-6 mx-6 pb-2"
          style="overflow-y: auto;"
        >
        {#each threads as thread}
        <li>
          <ThreadCard thread_name={thread.name}
          thread_id={thread.id} />
        </li>
      {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  .dash-root {
    position: absolute;
    top: 12vh;
    bottom: 4vh;
    left: 15%;
    right: 15%;
  }
  .dash-left {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 70%;
    overflow-y: auto;
  }
  .dash-right {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 30%;
    right: 0;
  }
  .tab-list {
    position: absolute;
    top: 0;
    height: 3rem;
    left: 0;
    right: 0;
  }
  .tab-content {
    position: absolute;
    top: 3rem;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .tab-title {
    position: absolute;
    top: 0;
    bottom: 90%;
    left: 0;
    right: 0;
  }
  .tab-content-list {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
</style>