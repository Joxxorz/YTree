package com.ytree.accounts;

import static com.ytree.accounts.AccountsService.*;
import static org.junit.jupiter.api.Assertions.*;

import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;

class AccountsServiceTest {
  private AccountsService service() {
    return new AccountsService(Clock.fixed(Instant.parse("2026-05-31T12:00:00Z"), ZoneOffset.UTC));
  }

  @Test
  void calendarBoundaryClampsToMonthEndAndIncludesCutoff() {
    LocalDate today = LocalDate.of(2026, 5, 31);
    assertEquals(Status.Missing, status(null, today));
    assertEquals(Status.Uploaded, status(new Statement("a", LocalDate.of(2026, 2, 28)), today));
    assertEquals(Status.Outdated, status(new Statement("a", LocalDate.of(2026, 2, 27)), today));
    assertEquals(
        Status.Uploaded,
        status(new Statement("a", LocalDate.of(2024, 2, 29)), LocalDate.of(2024, 5, 31)));
    assertEquals(
        Status.Uploaded,
        status(new Statement("a", LocalDate.of(2025, 12, 1)), LocalDate.of(2026, 3, 1)));
  }

  @Test
  void rejectsDuplicatesAtomically() {
    var s = service();
    var before = s.snapshot();
    assertThrows(RuleViolation.class, () -> s.add(new AddRequest(List.of("aviva", "barclays"))));
    assertEquals(before, s.snapshot());
    assertThrows(RuleViolation.class, () -> s.add(new AddRequest(List.of("aviva", "aviva"))));
    assertThrows(RuleViolation.class, () -> s.add(new AddRequest(List.of("aviva", "unknown"))));
    assertEquals(before, s.snapshot());
  }

  @Test
  void addsAndRemovesProviders() {
    var s = service();
    s.add(new AddRequest(List.of("aviva", "fidelity")));
    assertEquals(5, s.snapshot().accounts().size());
    s.remove("aviva");
    assertEquals(4, s.snapshot().accounts().size());
    s.add(new AddRequest(List.of("aviva")));
    assertEquals(Status.Missing, s.snapshot().accounts().getLast().status());
  }

  @Test
  void invalidUploadsPreserveExistingStatement() {
    var s = service();
    var before = s.snapshot();
    for (String date : List.of("2026-02-30", "2026-06-01", "not-a-date", "2026-2-01"))
      assertThrows(
          RuleViolation.class, () -> s.upload("barclays", new UploadRequest("a.pdf", date)));
    assertThrows(
        RuleViolation.class, () -> s.upload("barclays", new UploadRequest(" ", "2026-05-01")));
    assertEquals(before, s.snapshot());
  }

  @Test
  void submitRejectsIncompleteAndEmptyWithoutChangingData() {
    var s = service();
    var before = s.snapshot();
    var error = assertThrows(RuleViolation.class, s::submit);
    assertTrue(error.getMessage().contains("HSBC (Missing)"));
    assertTrue(error.getMessage().contains("Vanguard (Outdated)"));
    assertEquals(before, s.snapshot());
    for (String id : List.of("barclays", "hsbc", "vanguard")) s.remove(id);
    assertFalse(s.snapshot().canSubmit());
    assertThrows(RuleViolation.class, s::submit);
  }

  @Test
  void replacesStatementsAndAcceptsOnlyCurrentSet() {
    var s = service();
    s.upload("hsbc", new UploadRequest("hsbc.pdf", "2026-02-28"));
    s.upload("vanguard", new UploadRequest("new.pdf", "2026-05-31"));
    assertTrue(s.snapshot().canSubmit());
    assertEquals(3, s.submit().providerCount());
    s.upload("vanguard", new UploadRequest("old.pdf", "2026-02-27"));
    assertFalse(s.snapshot().canSubmit());
  }
}
