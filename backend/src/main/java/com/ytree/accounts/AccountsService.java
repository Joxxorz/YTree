package com.ytree.accounts;

import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AccountsService {
  public record Provider(String id, String name, String category) {}

  public record Statement(String filename, LocalDate date) {}

  public enum Status {
    Missing,
    Uploaded,
    Outdated
  }

  public record Account(Provider provider, Statement statement, Status status) {}

  public record Snapshot(
      List<Account> accounts,
      int readyCount,
      boolean canSubmit,
      LocalDate today,
      LocalDate cutoff) {}

  public record AddRequest(List<String> providerIds) {}

  public record UploadRequest(String filename, String date) {}

  public record Receipt(String id, int providerCount, Instant submittedAt) {}

  public static class RuleViolation extends RuntimeException {
    final int status;

    RuleViolation(int status, String message) {
      super(message);
      this.status = status;
    }
  }

  private final Clock clock;
  private final List<Provider> catalogue =
      List.of(
          new Provider("barclays", "Barclays", "Bank"), new Provider("hsbc", "HSBC", "Bank"),
          new Provider("vanguard", "Vanguard", "Investments"),
              new Provider("fidelity", "Fidelity", "Investments"),
          new Provider("aviva", "Aviva", "Pension"), new Provider("natwest", "NatWest", "Bank"),
          new Provider("hl", "Hargreaves Lansdown", "Investments"),
              new Provider("royal-london", "Royal London", "Pension"));
  private final LinkedHashMap<String, Statement> selected = new LinkedHashMap<>();

  public AccountsService(Clock clock) {
    this.clock = clock;
    selected.put("barclays", new Statement("barclays-statement.pdf", today().minusMonths(1)));
    selected.put("hsbc", null);
    selected.put("vanguard", new Statement("vanguard-statement.pdf", today().minusMonths(4)));
  }

  private LocalDate today() {
    return LocalDate.now(clock);
  }

  public static Status status(Statement statement, LocalDate today) {
    return statement == null
        ? Status.Missing
        : statement.date().isBefore(today.minusMonths(3)) ? Status.Outdated : Status.Uploaded;
  }

  public List<Provider> providers() {
    return catalogue;
  }

  private Provider provider(String id) {
    return catalogue.stream()
        .filter(p -> p.id().equals(id))
        .findFirst()
        .orElseThrow(() -> new RuleViolation(404, "Unknown provider."));
  }

  public synchronized Snapshot snapshot() {
    LocalDate date = today();
    List<Account> accounts =
        selected.entrySet().stream()
            .map(e -> new Account(provider(e.getKey()), e.getValue(), status(e.getValue(), date)))
            .toList();
    int ready = (int) accounts.stream().filter(a -> a.status() == Status.Uploaded).count();
    return new Snapshot(
        accounts,
        ready,
        !accounts.isEmpty() && ready == accounts.size(),
        date,
        date.minusMonths(3));
  }

  public synchronized Snapshot add(AddRequest request) {
    if (request == null || request.providerIds() == null || request.providerIds().isEmpty())
      throw new RuleViolation(400, "Choose at least one provider.");
    Set<String> ids = new HashSet<>();
    for (String id : request.providerIds()) {
      provider(id);
      if (!ids.add(id) || selected.containsKey(id))
        throw new RuleViolation(409, "A provider can only be added once.");
    }
    request.providerIds().forEach(id -> selected.put(id, null));
    return snapshot();
  }

  private void requireSelected(String id) {
    if (!selected.containsKey(id))
      throw new RuleViolation(404, "Provider is not in your accounts.");
  }

  public synchronized Snapshot remove(String id) {
    requireSelected(id);
    selected.remove(id);
    return snapshot();
  }

  public synchronized Snapshot upload(String id, UploadRequest request) {
    requireSelected(id);
    if (request == null
        || request.filename() == null
        || request.filename().isBlank()
        || request.filename().trim().length() > 200)
      throw new RuleViolation(400, "Enter a filename between 1 and 200 characters.");
    LocalDate date;
    try {
      if (request.date() == null || !request.date().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))
        throw new DateTimeParseException("Invalid date", "", 0);
      date = LocalDate.parse(request.date());
    } catch (DateTimeParseException e) {
      throw new RuleViolation(400, "Enter a valid statement date (YYYY-MM-DD).");
    }
    if (date.isAfter(today()))
      throw new RuleViolation(400, "Statement date cannot be in the future.");
    selected.put(id, new Statement(request.filename().trim(), date));
    return snapshot();
  }

  public synchronized Receipt submit() {
    Snapshot state = snapshot();
    if (state.accounts().isEmpty())
      throw new RuleViolation(422, "Add at least one provider before submitting.");
    if (!state.canSubmit()) {
      String names =
          String.join(
              ", ",
              state.accounts().stream()
                  .filter(a -> a.status() != Status.Uploaded)
                  .map(a -> a.provider().name() + " (" + a.status() + ")")
                  .toList());
      throw new RuleViolation(422, "Current statements are still needed for: " + names + ".");
    }
    return new Receipt(UUID.randomUUID().toString(), state.accounts().size(), clock.instant());
  }
}
