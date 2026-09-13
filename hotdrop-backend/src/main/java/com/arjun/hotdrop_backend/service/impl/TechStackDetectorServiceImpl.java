package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.TechStackDetectorService;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TechStackDetectorServiceImpl implements TechStackDetectorService {

    private final UserAgentProvider userAgentProvider;

    @Override
    public Set<String> detectTechStack(String url) {
        Set<String> tags = new LinkedHashSet<>();
        if (url == null || url.isBlank()) return tags;

        String targetUrl = url.trim().replaceAll("/+$", "");
        String currentUA = userAgentProvider.getRandomUserAgent();

        try {
            Connection.Response response = Jsoup.connect(targetUrl)
                    .userAgent(currentUA)
                    .timeout(6000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .execute();

            // 1. Lowercase Headers Map normalize
            Map<String, String> rawHeaders = response.headers();
            Map<String, String> headers = new HashMap<>();
            rawHeaders.forEach((k, v) -> headers.put(k.toLowerCase(), v.toLowerCase()));

            Map<String, String> cookies = response.cookies();
            Document doc = response.parse();
            String html = doc.html();
            String lowerHtml = html.toLowerCase();
            String serverHeader = headers.getOrDefault("server", "");
            String xPoweredBy = headers.getOrDefault("x-powered-by", "");
            String finalUrl = response.url().toString().toLowerCase();

            // ----------------------------------------------------
            // 1. HOSTING & CLOUD PLATFORMS (Redirected URL + Headers)
            // ----------------------------------------------------
            if (targetUrl.toLowerCase().contains(".vercel.app")
                    || finalUrl.contains(".vercel.app")
                    || headers.containsKey("x-vercel-id")
                    || headers.containsKey("x-vercel-cache")
                    || serverHeader.contains("vercel")) {
                tags.add("Vercel");
            }
            if (targetUrl.toLowerCase().contains(".netlify.app")
                    || finalUrl.contains(".netlify.app")
                    || headers.containsKey("x-nf-request-id")
                    || serverHeader.contains("netlify")) {
                tags.add("Netlify");
            }
            if (targetUrl.toLowerCase().contains(".onrender.com")
                    || finalUrl.contains(".onrender.com")
                    || headers.containsKey("x-render-origin-server")) {
                tags.add("Render");
            }
            if (headers.containsKey("x-railway-edge") || targetUrl.toLowerCase().contains(".up.railway.app")) {
                tags.add("Railway");
            }
            if (serverHeader.contains("fly.io") || headers.containsKey("fly-request-id")) {
                tags.add("Fly.io");
            }
            if (headers.containsKey("cf-ray") || serverHeader.contains("cloudflare")) {
                tags.add("Cloudflare");
            }
            if (headers.containsKey("x-amz-cf-id") || serverHeader.contains("cloudfront")) {
                tags.add("AWS CloudFront");
            }
            if (targetUrl.toLowerCase().contains(".github.io") || headers.containsKey("x-github-request-id")) {
                tags.add("GitHub Pages");
            }

            // ----------------------------------------------------
            // 2. FRONTEND FRAMEWORKS & COMPILERS
            // ----------------------------------------------------
            // Next.js
            if (doc.select("script#__NEXT_DATA__").size() > 0 || lowerHtml.contains("/_next/")) {
                tags.add("Next.js");
                tags.add("React");
                tags.add("JavaScript");
            }
            // Remix
            if (lowerHtml.contains("__remixcontext") || lowerHtml.contains("/entry.client-")) {
                tags.add("Remix");
                tags.add("React");
                tags.add("JavaScript");
            }
            // Gatsby
            if (doc.select("div#___gatsby").size() > 0) {
                tags.add("Gatsby");
                tags.add("React");
                tags.add("JavaScript");
            }
            // Nuxt.js
            if (doc.select("script#__NUXT_DATA__").size() > 0 || lowerHtml.contains("/_nuxt/")) {
                tags.add("Nuxt.js");
                tags.add("Vue.js");
                tags.add("JavaScript");
            }
            // Svelte & SvelteKit
            if (lowerHtml.contains("__sveltekit") || doc.select("[class*='svelte-']").size() > 0) {
                tags.add("SvelteKit");
                tags.add("Svelte");
                tags.add("JavaScript");
            }
            // Angular
            if (doc.select("[ng-version], app-root").size() > 0) {
                tags.add("Angular");
                tags.add("TypeScript");
            }
            // Astro
            if (doc.select("[data-astro-cid], astro-island").size() > 0) {
                tags.add("Astro");
            }
            // SolidJS
            if (lowerHtml.contains("data-hk=") || lowerHtml.contains("_$hy")) {
                tags.add("SolidJS");
                tags.add("JavaScript");
            }
            // React Core
            if (!tags.contains("React")) {
                if (doc.select("div#root, [data-reactroot]").size() > 0
                        || lowerHtml.contains("react")
                        || lowerHtml.contains("react-dom")) {
                    tags.add("React");
                    tags.add("JavaScript");
                }
            }
            // Vue Core
            if (!tags.contains("Vue.js")) {
                if (doc.select("div#app, [data-v-]").size() > 0) {
                    tags.add("Vue.js");
                    tags.add("JavaScript");
                }
            }

            // ----------------------------------------------------
            // 3. BUILD TOOLS & BUNDLERS (Vite & Webpack)
            // ----------------------------------------------------
            boolean hasViteScript = doc.select("script[type='module'][src*='assets/']").size() > 0
                    || doc.select("link[rel='modulepreload']").size() > 0
                    || lowerHtml.contains("/@vite/client");

            if (hasViteScript) {
                tags.add("Vite");
            }
            if (lowerHtml.contains("webpackjsonp")
                    || lowerHtml.contains("static/chunks/webpack")
                    || lowerHtml.contains("static/js/main.")) {
                tags.add("Webpack");
            }

            // ----------------------------------------------------
            // 4. STYLING & UI LIBRARIES
            // ----------------------------------------------------
            for (Element el : doc.select("[class]")) {
                String cls = el.className();
                if (cls.contains("flex") && (cls.contains("gap-") || cls.contains("items-") || cls.contains("bg-") || cls.contains("text-") || cls.contains("rounded-"))) {
                    tags.add("Tailwind CSS");
                    break;
                }
            }
            if (doc.select("link[href*='bootstrap'], script[src*='bootstrap']").size() > 0
                    || doc.select(".container-fluid, .col-md-, .navbar-nav").size() > 0) {
                tags.add("Bootstrap");
            }
            if (lowerHtml.contains("mui-")) tags.add("Material UI");
            if (lowerHtml.contains("chakra-")) tags.add("Chakra UI");
            if (lowerHtml.contains("ant-")) tags.add("Ant Design");
            if (lowerHtml.contains("lucide")) tags.add("Lucide");

            // ----------------------------------------------------
            // 5. BACKEND & RUNTIMES (C++, Rust, Go, Python, Java, Node, PHP)
            // ----------------------------------------------------
            // Native C++ Frameworks
            if (serverHeader.contains("crow") || serverHeader.contains("drogon") || serverHeader.contains("pistache")) {
                tags.add("C++");
            }
            if (cookies.containsKey("wtd") || serverHeader.contains("wthttp")) {
                tags.add("Wt (C++)");
                tags.add("C++");
            }

            // Strict WASM (Only when actual wasm binaries or MIME types exist)
            boolean hasWasmAsset = doc.select("link[href*='.wasm'], script[src*='.wasm']").size() > 0
                    || lowerHtml.contains("application/wasm")
                    || lowerHtml.contains("webassembly.instantiatestreaming");

            if (hasWasmAsset) {
                tags.add("WebAssembly");
            }

            // Rust
            if (serverHeader.contains("actix") || serverHeader.contains("rocket") || serverHeader.contains("axum") || headers.containsKey("x-rust-powered")) {
                tags.add("Rust");
            }

            // Go (Golang)
            if (serverHeader.contains("caddy") || xPoweredBy.contains("fiber") || headers.containsKey("x-powered-by-golang")) {
                tags.add("Go");
            }

            // Java / Spring Boot
            if (cookies.containsKey("jsessionid") || serverHeader.contains("tomcat") || serverHeader.contains("undertow") || serverHeader.contains("jetty")) {
                tags.add("Spring Boot");
                tags.add("Java");
            }
            if (lowerHtml.contains("quarkus") || serverHeader.contains("quarkus")) {
                tags.add("Quarkus");
                tags.add("Java");
            }

            // Python (Django / FastAPI / Flask)
            if (cookies.containsKey("csrftoken") && cookies.containsKey("sessionid")) {
                tags.add("Django");
                tags.add("Python");
            }
            if (serverHeader.contains("uvicorn")) {
                tags.add("FastAPI");
                tags.add("Python");
            }
            if (serverHeader.contains("gunicorn") || serverHeader.contains("werkzeug")) {
                tags.add("Python");
            }

            // Node.js & Alternative JS Runtimes
            if (xPoweredBy.contains("express") || cookies.containsKey("connect.sid")) {
                tags.add("Express");
                tags.add("Node.js");
            }
            if (serverHeader.contains("bun") || headers.containsKey("x-powered-by-bun")) {
                tags.add("Bun");
            }
            if (headers.containsKey("x-deno-ray") || serverHeader.contains("deno")) {
                tags.add("Deno");
            }

            // PHP / Ruby / .NET
            if (xPoweredBy.contains("php") || cookies.containsKey("phpsessid")) {
                tags.add("PHP");
            }
            if (cookies.containsKey("laravel_session") || cookies.containsKey("xsrf-token")) {
                tags.add("Laravel");
                tags.add("PHP");
            }
            if (cookies.containsKey("_session_id") && headers.containsKey("x-request-id")) {
                tags.add("Ruby on Rails");
                tags.add("Ruby");
            }
            if (xPoweredBy.contains("asp.net") || serverHeader.contains("kestrel") || cookies.containsKey("asp.net_sessionid")) {
                tags.add(".NET");
                tags.add("C#");
            }

            // ----------------------------------------------------
            // 6. BAAS & APIS
            // ----------------------------------------------------
            if (lowerHtml.contains("supabase.co")) tags.add("Supabase");
            if (lowerHtml.contains("firebaseapp.com") || lowerHtml.contains("firebaseio.com")) tags.add("Firebase");
            if (lowerHtml.contains("appwrite.io")) tags.add("Appwrite");
            if (lowerHtml.contains("/graphql") || lowerHtml.contains("__schema")) tags.add("GraphQL");

            // ----------------------------------------------------
            // 7. SPRING BOOT WHITELABEL FALLBACK PROBE
            // ----------------------------------------------------
            if (!tags.contains("Spring Boot")) {
                try {
                    Document probeDoc = Jsoup.connect(targetUrl + "/__hotdrop_probe_404__")
                            .userAgent(currentUA)
                            .timeout(1500)
                            .ignoreHttpErrors(true)
                            .get();

                    if (probeDoc.html().contains("Whitelabel Error Page")) {
                        tags.add("Spring Boot");
                        tags.add("Java");
                    }
                } catch (Exception ignored) {}
            }

        } catch (Exception e) {
            log.warn("Fingerprinting skipped/timed out for {}: {}", targetUrl, e.getMessage());
        }

        return tags;
    }
}