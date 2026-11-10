package com.stockflow.auth.security;

import com.stockflow.global.exception.ForbiddenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 이메일과 비밀번호로 가입하고 로그인하는 길을 열어 둘지.
 *
 * <p>이 서비스는 가입할 때 이메일 주인인지 확인하지 않고, 비밀번호를 잊으면 되찾을 방법도 없다.
 * 실제 사용자를 받는 동안에는 이 길을 닫고 구글 로그인만 남긴다. 화면에서 숨기는 것으로는 부족해서 서버가 거절한다.
 * 닫으면 로그인 화면의 데모 버튼도 같이 꺼진다. 데모 계정이 비밀번호로 들어오는 계정이기 때문이다.
 */
@Component
public class PasswordLoginPolicy {

    private final boolean enabled;

    public PasswordLoginPolicy(@Value("${stockflow.auth.password.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void requireEnabled() {
        if (!enabled) {
            throw new ForbiddenException("지금은 구글 계정으로만 로그인할 수 있어요.");
        }
    }
}
