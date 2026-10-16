package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.TechStackDetectorServiceImpl;
import com.arjun.hotdrop_backend.utils.UserAgentProvider;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.URL;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TechStackDetectorServiceImplTest {

    @Mock
    private UserAgentProvider userAgentProvider;

    @InjectMocks
    private TechStackDetectorServiceImpl techStackDetectorService;

    @Nested
    @DisplayName("URL Validation Tests")
    class UrlValidationTests {

        @Test
        @DisplayName("Should return empty set when url is null or blank")
        void detectTechStack_NullOrBlank_ReturnsEmptySet() {
            assertThat(techStackDetectorService.detectTechStack(null)).isEmpty();
            assertThat(techStackDetectorService.detectTechStack("")).isEmpty();
            assertThat(techStackDetectorService.detectTechStack("   ")).isEmpty();

            verifyNoInteractions(userAgentProvider);
        }
    }

    @Nested
    @DisplayName("HTML and Header Detection Tests")
    class DetectionTests {

        @Test
        @DisplayName("Should detect Vercel, Next.js, React, JavaScript, and Tailwind CSS from HTML and headers")
        void detectTechStack_NextJsVercelTailwind_Success() throws IOException {
            when(userAgentProvider.getRandomUserAgent()).thenReturn("Mozilla/5.0 Test");

            Connection mockConnection = mock(Connection.class);
            Connection.Response mockResponse = mock(Connection.Response.class);

            when(mockConnection.userAgent(anyString())).thenReturn(mockConnection);
            when(mockConnection.timeout(anyInt())).thenReturn(mockConnection);
            when(mockConnection.followRedirects(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.ignoreHttpErrors(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.ignoreContentType(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.execute()).thenReturn(mockResponse);

            when(mockResponse.statusCode()).thenReturn(200);
            when(mockResponse.url()).thenReturn(new URL("https://myapp.vercel.app"));
            when(mockResponse.headers()).thenReturn(Map.of("server", "vercel", "x-vercel-id", "iad1::1234"));
            when(mockResponse.cookies()).thenReturn(Collections.emptyMap());

            String html = "<html><head><script id='__NEXT_DATA__' type='application/json'>{}</script></head>" +
                    "<body><div class='flex items-center gap-4 bg-white'>Hello Next.js</div></body></html>";
            Document doc = Jsoup.parse(html);
            Document probeNotFoundDoc = Jsoup.parse("<html><body>Not Found</body></html>");
            when(mockResponse.parse()).thenReturn(doc);

            try (MockedStatic<Jsoup> mockedJsoup = mockStatic(Jsoup.class)) {
                mockedJsoup.when(() -> Jsoup.connect("https://myapp.vercel.app")).thenReturn(mockConnection);

                // Mock probe call if triggered
                Connection mockProbeConnection = mock(Connection.class);
                when(mockProbeConnection.userAgent(anyString())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.timeout(anyInt())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.followRedirects(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.ignoreHttpErrors(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.ignoreContentType(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.get()).thenReturn(probeNotFoundDoc);

                mockedJsoup.when(() -> Jsoup.connect("https://myapp.vercel.app/__hotdrop_probe_404__"))
                        .thenReturn(mockProbeConnection);

                Set<String> tags = techStackDetectorService.detectTechStack("myapp.vercel.app");

                assertThat(tags).contains("Vercel", "Next.js", "React", "JavaScript", "HTML", "Tailwind CSS");
            }
        }

        @Test
        @DisplayName("Should detect Java and Spring Boot from cookies and probe page")
        void detectTechStack_SpringBootJava_Success() throws IOException {
            when(userAgentProvider.getRandomUserAgent()).thenReturn("Mozilla/5.0 Test");

            Connection mockConnection = mock(Connection.class);
            Connection.Response mockResponse = mock(Connection.Response.class);

            when(mockConnection.userAgent(anyString())).thenReturn(mockConnection);
            when(mockConnection.timeout(anyInt())).thenReturn(mockConnection);
            when(mockConnection.followRedirects(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.ignoreHttpErrors(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.ignoreContentType(anyBoolean())).thenReturn(mockConnection);
            when(mockConnection.execute()).thenReturn(mockResponse);

            when(mockResponse.statusCode()).thenReturn(200);
            when(mockResponse.url()).thenReturn(new URL("https://springapp.com"));
            when(mockResponse.headers()).thenReturn(Map.of("server", "tomcat"));
            when(mockResponse.cookies()).thenReturn(Map.of("jsessionid", "12345ABC"));

            String html = "<html><body><h1>My App</h1></body></html>";
            Document doc = Jsoup.parse(html);
            Document probeSpringDoc = Jsoup.parse("<html><body>Whitelabel Error Page</body></html>");
            when(mockResponse.parse()).thenReturn(doc);

            try (MockedStatic<Jsoup> mockedJsoup = mockStatic(Jsoup.class)) {
                mockedJsoup.when(() -> Jsoup.connect("https://springapp.com")).thenReturn(mockConnection);

                Connection mockProbeConnection = mock(Connection.class);
                when(mockProbeConnection.userAgent(anyString())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.timeout(anyInt())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.followRedirects(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.ignoreHttpErrors(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.ignoreContentType(anyBoolean())).thenReturn(mockProbeConnection);
                when(mockProbeConnection.get()).thenReturn(probeSpringDoc);

                mockedJsoup.when(() -> Jsoup.connect("https://springapp.com/__hotdrop_probe_404__"))
                        .thenReturn(mockProbeConnection);

                Set<String> tags = techStackDetectorService.detectTechStack("https://springapp.com");

                assertThat(tags).contains("Java", "Spring Boot");
            }
        }

        @Test
        @DisplayName("Should handle network exception gracefully and return empty set")
        void detectTechStack_NetworkException_HandledGracefully() {
            when(userAgentProvider.getRandomUserAgent()).thenReturn("Mozilla/5.0 Test");

            try (MockedStatic<Jsoup> mockedJsoup = mockStatic(Jsoup.class)) {
                mockedJsoup.when(() -> Jsoup.connect(anyString())).thenThrow(new RuntimeException("Connection timed out"));

                Set<String> tags = techStackDetectorService.detectTechStack("https://unreachable-site.xyz");

                assertThat(tags).isEmpty();
            }
        }
    }
}
