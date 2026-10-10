package com.ytree.accounts;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
  public record Error(String message) {}

  @ExceptionHandler(AccountsService.RuleViolation.class)
  ResponseEntity<Error> rule(AccountsService.RuleViolation e) {
    return ResponseEntity.status(e.status).body(new Error(e.getMessage()));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<Error> malformed() {
    return ResponseEntity.badRequest()
        .body(new Error("Send a valid JSON request with the expected fields."));
  }
}
