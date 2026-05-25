package com.stockflow.memo.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.memo.dto.InvestmentMemoDto;
import com.stockflow.memo.dto.InvestmentMemoRequest;
import com.stockflow.memo.entity.InvestmentMemo;
import com.stockflow.memo.repository.InvestmentMemoRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvestmentMemoService {

    private final InvestmentMemoRepository memoRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public List<InvestmentMemoDto> getMemos() {
        return memoRepository.findByMemberIdOrderByCreatedAtDesc(currentMemberProvider.currentMemberId()).stream()
                .map(InvestmentMemoDto::from)
                .toList();
    }

    @Transactional
    public InvestmentMemoDto create(InvestmentMemoRequest request) {
        InvestmentMemo memo = memoRepository.save(InvestmentMemo.builder()
                .memberId(currentMemberProvider.currentMemberId())
                .symbol(request.symbol())
                .memoType(request.memoType())
                .title(request.title())
                .content(request.content())
                .checklist(joinChecklist(request.checklist()))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return InvestmentMemoDto.from(memo);
    }

    @Transactional
    public InvestmentMemoDto update(Long id, InvestmentMemoRequest request) {
        InvestmentMemo memo = findOwnedMemo(id);
        memo.update(request.symbol(), request.memoType(), request.title(), request.content(), joinChecklist(request.checklist()));
        return InvestmentMemoDto.from(memo);
    }

    @Transactional
    public void delete(Long id) {
        memoRepository.delete(findOwnedMemo(id));
    }

    private InvestmentMemo findOwnedMemo(Long id) {
        InvestmentMemo memo = memoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("투자 메모를 찾을 수 없습니다."));
        if (!memo.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 투자 메모입니다.");
        }
        return memo;
    }

    private String joinChecklist(List<String> checklist) {
        if (checklist == null || checklist.isEmpty()) {
            return "";
        }
        return String.join("\n", checklist);
    }
}
