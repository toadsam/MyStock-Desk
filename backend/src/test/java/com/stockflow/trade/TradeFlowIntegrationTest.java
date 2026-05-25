package com.stockflow.trade;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TradeFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginAndMarketBuyUpdatesCashAndLedger() throws Exception {
        String token = login("investor@stockflow.com", "stockflow1234");
        BigDecimal cashBefore = portfolioCash(token);

        mockMvc.perform(post("/api/trades/orders")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "symbol", "005930",
                                "orderType", "BUY",
                                "orderMethod", "MARKET",
                                "orderPrice", 78600,
                                "quantity", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        BigDecimal cashAfter = portfolioCash(token);
        assertTrue(cashAfter.compareTo(cashBefore) < 0);

        mockMvc.perform(get("/api/trades/ledger").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].orderType").value("BUY"))
                .andExpect(jsonPath("$.data[0].netCashAmount").value(-78612));
    }

    @Test
    void oversellOrderIsRejected() throws Exception {
        String token = login("investor@stockflow.com", "stockflow1234");

        mockMvc.perform(post("/api/trades/orders")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content(json(Map.of(
                                "symbol", "005930",
                                "orderType", "SELL",
                                "orderMethod", "MARKET",
                                "orderPrice", 78600,
                                "quantity", 999999
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void registerCreatesMemberPortfolioAndToken() throws Exception {
        String email = "new-investor@test.com";
        MvcResult register = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "새투자",
                                "email", email,
                                "password", "stockflow1234"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.member.email").value(email))
                .andReturn();

        String token = read(register, "data", "accessToken").asText();
        MvcResult portfolio = mockMvc.perform(get("/api/portfolio").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        assertEquals(0, new BigDecimal("100000000.00")
                .compareTo(read(portfolio, "data", "totalAsset").decimalValue()));
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        return read(result, "data", "accessToken").asText();
    }

    private BigDecimal portfolioCash(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/portfolio").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        return read(result, "data", "cash").decimalValue();
    }

    private JsonNode read(MvcResult result, String... path) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        for (String segment : path) {
            node = node.get(segment);
        }
        return node;
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
