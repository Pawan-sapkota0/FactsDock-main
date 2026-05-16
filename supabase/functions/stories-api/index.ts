import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "600",
};

export const handler = async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // TEST: Return immediately for published-stories
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname.includes("/published-stories")) {
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const method = req.method;

    console.log("stories-api request", { method, pathname });

    // ========================================================================
    // PUBLIC GET ROUTES (no auth required) - RETURN EARLY
    // ========================================================================
    
    const isPublicGet = method === "GET" && (
      pathname.includes("/published-stories") ||
      pathname.includes("/featured-stories") ||
      pathname.includes("/get-story/")
    );

    if (isPublicGet) {
      // GET published stories
      if (pathname.includes("/published-stories")) {
        console.log("[published-stories] Fetching...");
        const { data: stories, error } = await supabase
          .from("stories")
          .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at`)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("[published-stories] Success, count:", stories?.length || 0);
        return new Response(JSON.stringify({ data: stories || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET featured stories
      if (pathname.includes("/featured-stories")) {
        console.log("[featured-stories] Fetching...");
        const { data: featured, error } = await supabase
          .from("stories")
          .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at`)
          .eq("status", "published")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        if (featured && featured.length > 0) {
          console.log("[featured-stories] Success");
          return new Response(JSON.stringify({ data: featured }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: fallback, error: fallbackError } = await supabase
          .from("stories")
          .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at`)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3);

        if (fallbackError) throw fallbackError;
        console.log("[featured-stories] Fallback success");
        return new Response(JSON.stringify({ data: fallback || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET story by slug
      if (pathname.includes("/get-story/")) {
        const slug = url.searchParams.get("slug");
        if (!slug) {
          return new Response(JSON.stringify({ error: "Missing slug" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("[get-story] Fetching:", slug);
        const { data: story, error } = await supabase
          .from("stories")
          .select(`id, title, slug, description, content, cover_image, category_id, tags, reading_time, status, views, meta_title, meta_description, seo_keywords, author, publish_date, created_at, updated_at`)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (error) {
          console.log("[get-story] Error or not found:", slug);
          return new Response(JSON.stringify({ error: "Story not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("[get-story] Success:", slug);
        return new Response(JSON.stringify({ data: story }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ========================================================================
    // PROTECTED ROUTES (auth required)
    // ========================================================================

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    console.log("[auth] Authenticated user");

    // Check admin
    const { data: adminCheck } = await supabase
      .from("admins")
      .select("id")
      .eq("id", userId)
      .single();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[admin] Verified admin access");

    // GET all stories (admin view)
    if (method === "GET" && pathname.includes("/get-all-stories")) {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(
          `id, title, slug, description, content, cover_image, category_id,
           tags, reading_time, status, is_featured, is_trending, views,
           meta_title, meta_description, seo_keywords, author, publish_date,
           created_at, updated_at, story_categories(name, slug)`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data: stories }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET single story by slug
    if (method === "GET" && pathname.includes("/get-story/")) {
      const slug = url.searchParams.get("slug");
      if (!slug) {
        return new Response(JSON.stringify({ error: "Missing slug" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: story, error } = await supabase
        .from("stories")
        .select(
          `id, title, slug, description, content, cover_image, 
           category_id, tags, reading_time, status, views, 
           meta_title, meta_description, seo_keywords, author, 
           publish_date, created_at, updated_at,
           story_categories(id, name, slug)`
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;
      if (!story) {
        return new Response(JSON.stringify({ error: "Story not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data: story }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET featured stories (admin view)
    if (method === "GET" && pathname.includes("/featured-stories")) {
      const { data: featuredStories, error } = await supabase
        .from("stories")
        .select(`id, title, slug, description, content, cover_image, category_id, tags, reading_time, status, is_featured, is_trending, views, meta_title, meta_description, seo_keywords, author, publish_date, created_at, updated_at`)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      if (featuredStories && featuredStories.length > 0) {
        return new Response(JSON.stringify({ data: featuredStories }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: show recent stories if no featured items exist
      const { data: fallbackStories, error: fallbackError } = await supabase
        .from("stories")
        .select(`id, title, slug, description, content, cover_image, category_id, tags, reading_time, status, is_featured, is_trending, views, meta_title, meta_description, seo_keywords, author, publish_date, created_at, updated_at`)
        .order("created_at", { ascending: false })
        .limit(3);

      if (fallbackError) throw fallbackError;

      return new Response(JSON.stringify({ data: fallbackStories }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET published stories (admin view)
    if (method === "GET" && pathname.includes("/published-stories")) {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(`id, title, slug, description, content, cover_image, category_id, tags, reading_time, status, is_featured, is_trending, views, meta_title, meta_description, seo_keywords, author, publish_date, created_at, updated_at`)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data: stories }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST create story
    if (method === "POST" && pathname.includes("/create-story")) {
      try {
        console.log("[create-story] Received request");
        const body = await req.json();
        console.log("[create-story] Body parsed", {
          title: body.title,
          slug: body.slug,
          hasContent: !!body.content,
          status: body.status,
        });

        const {
          title,
          slug,
          description,
          content,
          cover_image,
          category_id,
          tags,
          reading_time,
          status,
          meta_title,
          meta_description,
          seo_keywords,
          is_featured,
        } = body;

        if (!title || !slug || !description || !cover_image || !category_id) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const insertStatus = status === "published" ? "published" : "draft";
        const publishDate = insertStatus === "published" ? new Date().toISOString() : null;

        console.log("[create-story] Attempting database insert", { insertStatus });
        const { data: story, error } = await supabase
          .from("stories")
          .insert({
            title,
            slug,
            description,
            content: content || {},
            cover_image,
            category_id,
            tags: tags || [],
            reading_time,
            status: insertStatus,
            publish_date: publishDate,
            is_featured: is_featured || false,
            meta_title,
            meta_description,
            seo_keywords,
            created_by: data.user.id,
          })
          .select()
          .single();

        if (error) {
          console.error("[create-story] Database error", error);
          throw error;
        }

        console.log("[create-story] Success");
        return new Response(JSON.stringify({ data: story }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("[create-story] Error", err);
        throw err;
      }
    }

    // PUT update story
    if (method === "PUT" && pathname.includes("/update-story/")) {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing story id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { data: story, error } = await supabase
        .from("stories")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data: story }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE story
    if (method === "DELETE" && pathname.includes("/delete-story/")) {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing story id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Publish/Unpublish story
    if (method === "PATCH" && pathname.includes("/publish-story/")) {
      const id = url.searchParams.get("id");
      const status = url.searchParams.get("status");

      if (!id || !status) {
        return new Response(
          JSON.stringify({ error: "Missing id or status" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: story, error } = await supabase
        .from("stories")
        .update({ 
          status, 
          publish_date: status === "published" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data: story }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
