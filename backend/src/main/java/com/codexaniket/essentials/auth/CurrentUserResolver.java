package com.codexaniket.essentials.auth;

import com.codexaniket.essentials.exception.ApiException;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.service.AuthService;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Optional;

/**
 * Reads "Authorization: Bearer &lt;token&gt;", looks the token up and hands the
 * matching user to any controller parameter marked with {@link CurrentUser}.
 */
@Component
public class CurrentUserResolver implements HandlerMethodArgumentResolver {

    private final AuthService authService;

    public CurrentUserResolver(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && AppUser.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Optional<AppUser> user = authService.findUserByToken(
                AuthService.extractBearerToken(webRequest.getHeader(HttpHeaders.AUTHORIZATION)));

        CurrentUser annotation = parameter.getParameterAnnotation(CurrentUser.class);
        if (user.isEmpty() && annotation != null && annotation.required()) {
            throw ApiException.unauthorized("Please log in first");
        }
        return user.orElse(null);
    }
}
