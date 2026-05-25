package com.stockflow.theme.service;

import com.stockflow.theme.dto.RelatedThemeStockDto;
import com.stockflow.theme.dto.SupplyChainStageDto;
import com.stockflow.theme.dto.ThemeCatalystDto;
import com.stockflow.theme.dto.ThemeDiscoveryDto;
import com.stockflow.theme.dto.ThemeNewsItemDto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ThemeDiscoveryService {

    private final LiveThemeDataProvider liveThemeDataProvider;
    public List<ThemeDiscoveryDto> getThemes() {
        return themes().stream().map(this::withLiveData).toList();
    }

    public List<ThemeDiscoveryDto> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getThemes();
        }
        String lowerKeyword = keyword.toLowerCase(Locale.ROOT);
        List<ThemeDiscoveryDto> result = themes().stream()
                .filter(theme -> matches(theme, lowerKeyword))
                .toList();
        return (result.isEmpty() ? themes() : result).stream().map(this::withLiveData).toList();
    }

    private ThemeDiscoveryDto withLiveData(ThemeDiscoveryDto theme) {
        List<RelatedThemeStockDto> liveStocks = theme.relatedStocks().parallelStream()
                .map(stock -> liveThemeDataProvider.enrichRelation(theme.sourceCompany(), theme.repeatedKeywords(), stock))
                .sorted((left, right) -> Integer.compare(right.relationScore(), left.relationScore()))
                .toList();
        List<ThemeNewsItemDto> liveNews = liveThemeDataProvider.fetchNews(theme.sourceCompany() + " AI GPU HBM data center");
        List<String> liveKeywords = liveThemeDataProvider.extractKeywords(liveNews, theme.repeatedKeywords());
        return new ThemeDiscoveryDto(
                theme.id(),
                theme.keyword(),
                theme.title(),
                theme.sourceCompany(),
                theme.summary(),
                theme.catalyst(),
                theme.stages(),
                liveStocks,
                theme.beginnerSummary(),
                theme.aiCheckpoints(),
                theme.riskNotes(),
                liveKeywords,
                liveNews,
                LocalDateTime.now()
        );
    }

    private boolean matches(ThemeDiscoveryDto theme, String keyword) {
        if (contains(theme.keyword(), keyword)
                || contains(theme.title(), keyword)
                || contains(theme.sourceCompany(), keyword)
                || theme.repeatedKeywords().stream().anyMatch(value -> contains(value, keyword))) {
            return true;
        }
        return theme.relatedStocks().stream()
                .anyMatch(stock -> contains(stock.stockName(), keyword)
                        || contains(stock.symbol(), keyword)
                        || stock.tags().stream().anyMatch(tag -> contains(tag, keyword)));
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private List<ThemeDiscoveryDto> themes() {
        return List.of(new ThemeDiscoveryDto(
                "nvidia-ai-supply-chain",
                "nvidia",
                "엔비디아 AI 반도체 공급망",
                "NVIDIA",
                "엔비디아 호재는 GPU 자체보다 HBM, 파운드리, 패키징, AI 서버, 데이터센터 전력/냉각으로 영향이 퍼지는지 확인하는 흐름이 중요합니다.",
                new ThemeCatalystDto(
                        "AI GPU 수요와 데이터센터 투자 확대",
                        "AI 학습/추론 서버 투자가 늘면 고성능 GPU뿐 아니라 메모리, 기판, 장비, 전력 인프라 수요도 함께 점검 대상이 됩니다.",
                        List.of("엔비디아", "AI GPU", "HBM/패키징", "AI 서버/PCB", "데이터센터 전력/냉각")
                ),
                List.of(
                        stage("gpu", "핵심 기업", "이슈의 출발점이 되는 AI GPU와 가속기 생태계입니다.", "GPU 출하, 데이터센터 매출, 고객사 투자 계획", List.of("NVDA", "AMD")),
                        stage("memory", "HBM/메모리", "AI GPU에 붙는 고대역폭 메모리 공급망입니다.", "HBM 공급 계약, 수율, 메모리 가격", List.of("000660", "005930", "MU")),
                        stage("foundry", "파운드리/패키징", "칩 생산과 고급 패키징을 담당하는 영역입니다.", "첨단 공정 가동률, CoWoS/패키징 증설", List.of("TSM", "042700")),
                        stage("server", "AI 서버/기판", "GPU를 실제 서버로 구성하는 하드웨어 영역입니다.", "서버 수주, PCB 공급, 고객사 집중도", List.of("SMCI", "007660")),
                        stage("power", "전력/냉각 인프라", "데이터센터 증가로 전력기기와 냉각 수요가 늘어나는 영역입니다.", "데이터센터 CAPEX, 전력 장비 수주, 마진", List.of("VRT", "010120"))
                ),
                List.of(
                        stock("NVDA", "NVIDIA", "US", "gpu", "핵심 기업", 1120, "DIRECT", "AI GPU 수요 증가 이슈의 출발점입니다.", List.of("데이터센터 매출", "GPU 공급량", "주요 클라우드 고객 주문"), List.of("이미 높은 기대가 가격에 반영됐을 수 있음", "미중 규제와 공급 제약"), List.of("AI GPU", "대장주")),
                        stock("000660", "SK hynix", "KR", "memory", "HBM/메모리", 196500, "DIRECT", "HBM 공급 확대 이슈가 엔비디아 GPU 수요와 직접 연결되는지 확인할 종목입니다.", List.of("HBM 매출 비중", "영업이익률", "공급 계약 뉴스"), List.of("HBM 기대 과열", "메모리 업황 둔화"), List.of("HBM", "메모리")),
                        stock("005930", "Samsung Electronics", "KR", "memory", "HBM/메모리", 78600, "INDIRECT", "메모리와 파운드리 양쪽 노출이 있어 AI 반도체 투자 사이클을 함께 볼 수 있습니다.", List.of("HBM 수율", "파운드리 가동률", "메모리 가격"), List.of("특정 테마 영향이 희석될 수 있음"), List.of("메모리", "파운드리")),
                        stock("042700", "Hanmi Semiconductor", "KR", "foundry", "파운드리/패키징", 146000, "DIRECT", "HBM용 패키징 장비 수요와 연결되는 장비주로 분류됩니다.", List.of("장비 수주", "고객사 투자", "영업이익률"), List.of("수주 공백 시 변동성", "단기 테마 과열"), List.of("패키징", "장비")),
                        stock("007660", "IsuPetasys", "KR", "server", "AI 서버/기판", 48200, "INDIRECT", "AI 서버용 고성능 PCB 수요 증가와 연결해 공부할 수 있습니다.", List.of("AI 서버 PCB 매출", "고객사 다변화", "마진"), List.of("특정 고객 의존도", "증설 비용"), List.of("PCB", "AI서버")),
                        stock("TSM", "TSMC", "US", "foundry", "파운드리/패키징", 164, "DIRECT", "엔비디아 GPU 생산과 첨단 패키징 병목을 함께 확인하는 핵심 파운드리입니다.", List.of("첨단 공정 매출", "CoWoS 증설", "가동률"), List.of("지정학 리스크", "기대 선반영 가능"), List.of("파운드리", "패키징")),
                        stock("SMCI", "Super Micro Computer", "US", "server", "AI 서버/기판", 830, "INDIRECT", "GPU를 탑재한 AI 서버 수요와 연결되는 하드웨어 기업입니다.", List.of("서버 수주", "마진", "재고 회전"), List.of("회계/공시 이슈 확인 필요", "경쟁 심화"), List.of("AI서버", "하드웨어")),
                        stock("VRT", "Vertiv", "US", "power", "전력/냉각 인프라", 96, "INDIRECT", "데이터센터 확대로 전력 관리와 냉각 인프라 수요가 늘어나는지 확인할 종목입니다.", List.of("데이터센터 수주", "영업이익률", "전력 인프라 투자"), List.of("밸류에이션 부담", "수주 둔화"), List.of("전력", "냉각")),
                        stock("010120", "LS ELECTRIC", "KR", "power", "전력/냉각 인프라", 130000, "INDIRECT", "국내 전력기기와 데이터센터 전력 인프라 수요를 함께 확인할 수 있습니다.", List.of("전력기기 수주", "북미 매출", "마진"), List.of("원자재 가격", "수주 기대 선반영"), List.of("전력기기", "인프라"))
                ),
                List.of(
                        "대장주 호재가 항상 모든 관련주 수익으로 이어지는 것은 아닙니다.",
                        "관련도가 높은지보다 실제 매출과 수주에 연결되는지 확인해야 합니다.",
                        "예산이 작다면 가격이 낮은 종목보다 변동성과 사업 이해도를 먼저 봐야 합니다."
                ),
                List.of(
                        "HBM 공급 확대 뉴스가 반복되는지, 실제 분기 실적에서 매출로 확인되는지 보세요.",
                        "AI 서버와 전력 인프라 기업은 데이터센터 투자 계획이 둔화될 때 같이 흔들릴 수 있습니다.",
                        "반도체 보유 비중이 이미 높다면 관련주를 추가하기 전 포트폴리오 쏠림을 점검하세요."
                ),
                List.of(
                        "단순 테마주는 뉴스가 약해지면 급격히 변동할 수 있습니다.",
                        "미국 대형주 이슈가 국내 중소형주 실적으로 연결되는 데 시간이 걸릴 수 있습니다.",
                        "낮은 주가가 낮은 위험을 의미하지는 않습니다."
                ),
                List.of("HBM", "AI GPU", "CoWoS", "데이터센터", "전력기기", "AI 서버"),
                List.of(),
                LocalDateTime.now()
        ));
    }

    private SupplyChainStageDto stage(String id, String name, String description, String focus, List<String> stockSymbols) {
        return new SupplyChainStageDto(id, name, description, focus, stockSymbols);
    }

    private RelatedThemeStockDto stock(String symbol, String stockName, String market, String stageId, String stageName,
                                      int currentPrice, String relationLevel, String relationReason,
                                      List<String> checkMetrics, List<String> risks, List<String> tags) {
        return new RelatedThemeStockDto(symbol, stockName, market, stageId, stageName, BigDecimal.valueOf(currentPrice),
                relationLevel, relationReason, checkMetrics, risks, tags, 0, 0, List.of(), List.of(), null);
    }
}
