package com.ytree.accounts;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AccountsApiTest {
  @Autowired MockMvc mvc;

  @Test
  void corsAllowsConfiguredFrontendAndRejectsOtherOrigins() throws Exception {
    mvc.perform(
            options("/api/accounts/hsbc/statement")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "PUT")
                .header("Access-Control-Request-Headers", "content-type"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    mvc.perform(
            options("/api/accounts")
                .header("Origin", "https://unapproved.example")
                .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isForbidden());
  }

  @Test
  void apiRejectsBypassedUiAndMalformedRequests() throws Exception {
    mvc.perform(get("/api/accounts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accounts.length()").value(3))
        .andExpect(jsonPath("$.canSubmit").value(false));
    mvc.perform(post("/api/submissions"))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.message").exists());
    mvc.perform(
            post("/api/accounts")
                .contentType("application/json")
                .content("{\"providerIds\":[\"barclays\"]}"))
        .andExpect(status().isConflict());
    mvc.perform(post("/api/accounts").contentType("application/json").content("{}"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/accounts/hsbc/statement")
                .contentType("application/json")
                .content("{\"filename\":\"a.pdf\",\"date\":\"2026-02-30\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/accounts/nope/statement")
                .contentType("application/json")
                .content("{\"filename\":\"a.pdf\",\"date\":\"2026-01-01\"}"))
        .andExpect(status().isNotFound());
    mvc.perform(post("/api/accounts").contentType("application/json").content("broken"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").exists());
  }
}
