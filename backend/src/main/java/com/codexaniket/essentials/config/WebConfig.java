package com.codexaniket.essentials.config;

import com.codexaniket.essentials.auth.CurrentUserResolver;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties props;
    private final CurrentUserResolver currentUserResolver;

    public WebConfig(AppProperties props, CurrentUserResolver currentUserResolver) {
        this.props = props;
        this.currentUserResolver = currentUserResolver;
    }

    /**
     * Lets the frontend call the API from a different origin: the Vite dev server
     * locally, the Vercel site in production. Patterns such as https://*.vercel.app
     * are allowed (login uses a Bearer token, not cookies, so this exposes no session).
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(props.cors().allowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    /** Makes "@CurrentUser AppUser user" work in controller methods. */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserResolver);
    }

    /** HTTP client used for OpenStreetMap services, with a timeout and a User-Agent. */
    @Bean
    public RestClient osmRestClient(RestClient.Builder builder) {
        HttpClient httpClient = HttpClient.newBuilder()
                // Plain HTTP/1.1: the public Overpass servers are slow to answer over HTTP/2.
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(props.osm().timeoutSeconds()));
        return builder
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.USER_AGENT, props.osm().userAgent())
                .build();
    }
}
