package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.TechStackDetectorService;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
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

        if (url == null || url.isBlank()) {
            return tags;
        }
        String targetUrl = url.trim().replaceAll("/+$", "");

        if (!targetUrl.toLowerCase().startsWith("http://")
                && !targetUrl.toLowerCase().startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
        }

        log.info("Checking technologies used by: {}", targetUrl);

        String currentUA = userAgentProvider.getRandomUserAgent();

        boolean primaryRequestSucceeded = false;

        try {
            Connection.Response response = Jsoup.connect(targetUrl)
                    .userAgent(currentUA)
                    .timeout(6000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .ignoreContentType(true)
                    .execute();

            primaryRequestSucceeded =
                    response.statusCode() >= 200
                            && response.statusCode() < 400;


            Map<String, String> headers = new HashMap<>();

            response.headers().forEach(
                    (key, value) ->
                            headers.put(
                                    key.toLowerCase(Locale.ROOT),
                                    value.toLowerCase(Locale.ROOT)
                            )
            );

            Map<String, String> cookies = new HashMap<>();

            response.cookies().forEach(
                    (key, value) ->
                            cookies.put(
                                    key.toLowerCase(Locale.ROOT),
                                    value
                            )
            );

            Document doc = response.parse();

            String html = doc.html();
            String lowerHtml = html.toLowerCase(Locale.ROOT);
            boolean hasHtml = !doc.children().isEmpty();

            boolean hasCss =
                    !doc.select("link[rel='stylesheet']").isEmpty()
                            || !doc.select("style").isEmpty()
                            || lowerHtml.contains("<style");

            boolean hasJavaScript =
                    !doc.select("script").isEmpty()
                            || lowerHtml.contains("javascript:");

            if (hasHtml) {
                tags.add("HTML");
            }

            if (hasCss) {
                tags.add("CSS");
            }

            if (hasJavaScript) {
                tags.add("JavaScript");
            }
            String serverHeader =
                    headers.getOrDefault("server", "");

            String xPoweredBy =
                    headers.getOrDefault("x-powered-by", "");

            String finalUrl =
                    response.url().toString()
                            .toLowerCase(Locale.ROOT);


            if (targetUrl.toLowerCase().contains(".vercel.app")
                    || finalUrl.contains(".vercel.app")
                    || headers.containsKey("x-vercel-id")
                    || headers.containsKey("x-vercel-cache")
                    || serverHeader.contains("vercel")) {

                tags.add("Vercel");
            }

            // Netlify
            if (targetUrl.toLowerCase().contains(".netlify.app")
                    || finalUrl.contains(".netlify.app")
                    || headers.containsKey("x-nf-request-id")
                    || serverHeader.contains("netlify")) {

                tags.add("Netlify");
            }

            // Render
            if (targetUrl.toLowerCase().contains(".onrender.com")
                    || finalUrl.contains(".onrender.com")
                    || headers.containsKey("x-render-origin-server")) {

                tags.add("Render");
            }

            // Railway
            if (targetUrl.toLowerCase().contains(".up.railway.app")
                    || headers.containsKey("x-railway-edge")) {

                tags.add("Railway");
            }

            // Fly.io
            if (serverHeader.contains("fly.io")
                    || headers.containsKey("fly-request-id")) {

                tags.add("Fly.io");
            }

            // Cloudflare
            if (headers.containsKey("cf-ray")
                    || serverHeader.contains("cloudflare")) {

                tags.add("Cloudflare");
            }

            // AWS CloudFront
            if (headers.containsKey("x-amz-cf-id")
                    || serverHeader.contains("cloudfront")) {

                tags.add("AWS CloudFront");
            }

            // GitHub Pages
            if (targetUrl.toLowerCase().contains(".github.io")
                    || headers.containsKey("x-github-request-id")) {

                tags.add("GitHub Pages");
            }




//Next.ja
            if (!doc.select("script#__NEXT_DATA__").isEmpty()
                    || lowerHtml.contains("/_next/")) {

                tags.add("Next.js");
                tags.add("React");
                tags.add("JavaScript");
            }
            if (lowerHtml.contains("__remixcontext")
                    || lowerHtml.contains("/entry.client-")) {

                tags.add("Remix");
                tags.add("React");
                tags.add("JavaScript");
            }

            if (!doc.select("div#___gatsby").isEmpty()) {

                tags.add("Gatsby");
                tags.add("React");
                tags.add("JavaScript");
            }




            if (!doc.select("script#__NUXT_DATA__").isEmpty()
                    || lowerHtml.contains("/_nuxt/")) {

                tags.add("Nuxt.js");
                tags.add("Vue.js");
                tags.add("JavaScript");
            }




            if (lowerHtml.contains("__sveltekit")
                    || !doc.select("[class*='svelte-']").isEmpty()) {

                tags.add("SvelteKit");
                tags.add("Svelte");
                tags.add("JavaScript");
            }



            if (!doc.select("[ng-version], app-root").isEmpty()) {

                tags.add("Angular");
                tags.add("TypeScript");
            }



            if (!doc.select("[data-astro-cid], astro-island").isEmpty()) {

                tags.add("Astro");
            }
            if (lowerHtml.contains("data-hk=")
                    || lowerHtml.contains("_$hy")) {

                tags.add("SolidJS");
                tags.add("JavaScript");
            }
            if (!tags.contains("React")) {

                if (!doc.select("div#root, [data-reactroot]").isEmpty()
                        || lowerHtml.contains("react-dom")
                        || lowerHtml.contains("__reactfiber")) {

                    tags.add("React");
                    tags.add("JavaScript");
                }
            }


            if (!tags.contains("Vue.js")) {

                if (!doc.select("div#app, [data-v-]").isEmpty()
                        || lowerHtml.contains("__vue__")) {

                    tags.add("Vue.js");
                    tags.add("JavaScript");
                }
            }


            boolean hasVite =
                    !doc.select(
                            "script[type='module'][src*='assets/']"
                    ).isEmpty()
                            || !doc.select(
                            "link[rel='modulepreload']"
                    ).isEmpty()
                            || lowerHtml.contains("/@vite/client");

            if (hasVite) {
                tags.add("Vite");
            }

            boolean hasWebpack =
                    lowerHtml.contains("webpackjsonp")
                            || lowerHtml.contains("static/chunks/webpack")
                            || lowerHtml.contains("static/js/main.");

            if (hasWebpack) {
                tags.add("Webpack");
            }


            Elements elementsWithClass = doc.select("[class]");

            int scanLimit =
                    Math.min(elementsWithClass.size(), 120);

            for (int i = 0; i < scanLimit; i++) {

                Element element = elementsWithClass.get(i);

                String className = element.className();

                if (className.contains("flex")
                        && (
                        className.contains("gap-")
                                || className.contains("items-")
                                || className.contains("bg-")
                                || className.contains("text-")
                                || className.contains("rounded-")
                )) {

                    tags.add("Tailwind CSS");
                    break;
                }
            }

            if (!doc.select(
                    "link[href*='bootstrap'], " +
                            "script[src*='bootstrap']"
            ).isEmpty()
                    || !doc.select(
                    ".container-fluid, .navbar-nav"
            ).isEmpty()) {

                tags.add("Bootstrap");
            }




            if (lowerHtml.contains("mui-")) {
                tags.add("Material UI");
            }

            if (lowerHtml.contains("chakra-")) {
                tags.add("Chakra UI");
            }

            if (lowerHtml.contains("ant-")) {
                tags.add("Ant Design");
            }

            if (lowerHtml.contains("lucide")) {
                tags.add("Lucide");
            }


            boolean hasWasm =
                    !doc.select(
                            "link[href*='.wasm'], script[src*='.wasm']"
                    ).isEmpty()
                            || lowerHtml.contains("application/wasm")
                            || lowerHtml.contains(
                            "webassembly.instantiatestreaming"
                    );

            if (hasWasm) {
                tags.add("WebAssembly");
            }


            boolean javaSignal =
                    cookies.containsKey("jsessionid")
                            || serverHeader.contains("tomcat")
                            || serverHeader.contains("undertow")
                            || serverHeader.contains("jetty");

            if (javaSignal) {

                tags.add("Java");
            }
            boolean springSignal =
                    lowerHtml.contains("spring")
                            || lowerHtml.contains("spring-boot")
                            || serverHeader.contains("spring");

            if (springSignal) {

                tags.add("Spring Boot");
                tags.add("Java");
            }

            if (lowerHtml.contains("quarkus")
                    || serverHeader.contains("quarkus")) {

                tags.add("Quarkus");
                tags.add("Java");
            }


            boolean djangoSignal =
                    cookies.containsKey("csrftoken")
                            && cookies.containsKey("sessionid");

            if (djangoSignal) {

                tags.add("Django");
                tags.add("Python");
            }

            if (serverHeader.contains("uvicorn")
                    || lowerHtml.contains("fastapi")) {

                tags.add("FastAPI");
                tags.add("Python");
            }



            if (serverHeader.contains("werkzeug")
                    || lowerHtml.contains("flask")) {

                tags.add("Flask");
                tags.add("Python");
            }




            if (serverHeader.contains("gunicorn")) {

                tags.add("Python");
            }

            boolean expressSignal =
                    xPoweredBy.contains("express")
                            || cookies.containsKey("connect.sid")
                            || lowerHtml.contains("express");

            if (expressSignal) {

                tags.add("Express");
                tags.add("Node.js");
            }


            if (serverHeader.contains("node.js")
                    || xPoweredBy.contains("node.js")) {

                tags.add("Node.js");
            }



            if (serverHeader.contains("bun")
                    || headers.containsKey("x-powered-by-bun")) {

                tags.add("Bun");
            }




            if (serverHeader.contains("deno")
                    || headers.containsKey("x-deno-ray")) {

                tags.add("Deno");
            }




            boolean phpSignal =
                    xPoweredBy.contains("php")
                            || cookies.containsKey("phpsessid")
                            || lowerHtml.contains(".php");

            if (phpSignal) {

                tags.add("PHP");
            }

            if (cookies.containsKey("laravel_session")
                    || cookies.containsKey("xsrf-token")
                    || lowerHtml.contains("laravel")) {

                tags.add("Laravel");
                tags.add("PHP");
            }

            if (cookies.containsKey("_session_id")
                    || serverHeader.contains("puma")
                    || lowerHtml.contains("rails")) {

                tags.add("Ruby on Rails");
                tags.add("Ruby");
            }



            boolean dotNetSignal =
                    xPoweredBy.contains("asp.net")
                            || serverHeader.contains("kestrel")
                            || cookies.containsKey("asp.net_sessionid")
                            || lowerHtml.contains("asp.net");

            if (dotNetSignal) {

                tags.add(".NET");
                tags.add("C#");
            }



            if (serverHeader.contains("caddy")
                    || xPoweredBy.contains("fiber")
                    || headers.containsKey("x-powered-by-golang")
                    || lowerHtml.contains("gin-gonic")) {

                tags.add("Go");
            }


            if (serverHeader.contains("actix")
                    || serverHeader.contains("rocket")
                    || serverHeader.contains("axum")
                    || headers.containsKey("x-rust-powered")) {

                tags.add("Rust");
            }


            if (serverHeader.contains("crow")
                    || serverHeader.contains("drogon")
                    || serverHeader.contains("pistache")) {

                tags.add("C++");
            }

            if (cookies.containsKey("wtd")
                    || serverHeader.contains("wthttp")) {

                tags.add("Wt (C++)");
                tags.add("C++");
            }

            if (lowerHtml.contains("supabase.co")) {
                tags.add("Supabase");
            }

            if (lowerHtml.contains("firebaseapp.com")
                    || lowerHtml.contains("firebaseio.com")) {

                tags.add("Firebase");
            }

            if (lowerHtml.contains("appwrite.io")) {
                tags.add("Appwrite");
            }

            if (lowerHtml.contains("/graphql")
                    || lowerHtml.contains("__schema")) {

                tags.add("GraphQL");
            }



            if (primaryRequestSucceeded
                    && !tags.contains("Spring Boot")) {

                try {

                    Document probeDoc =
                            Jsoup.connect(
                                            targetUrl
                                                    + "/__hotdrop_probe_404__"
                                    )
                                    .userAgent(currentUA)
                                    .timeout(1200)
                                    .followRedirects(true)
                                    .ignoreHttpErrors(true)
                                    .ignoreContentType(true)
                                    .get();

                    String probeHtml =
                            probeDoc.html()
                                    .toLowerCase(Locale.ROOT);

                    if (probeHtml.contains("whitelabel error page")
                            || probeHtml.contains(
                            "this application has no explicit mapping"
                    )) {

                        tags.add("Spring Boot");
                        tags.add("Java");
                    }

                } catch (Exception ignored) {

                }
            }

        } catch (Exception e) {

            log.warn(
                    "Could not detect technologies for {}: {}",
                    targetUrl,
                    e.getMessage()
            );
        }

        log.info(
                "Finished checking technologies for {}. Found {}: {}",
                targetUrl,
                tags.size(),
                tags
        );

        return tags;
    }
}