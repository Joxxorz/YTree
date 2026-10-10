package com.ytree.accounts;

import static com.ytree.accounts.AccountsService.*;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountsController {
  private final AccountsService service;

  public AccountsController(AccountsService service) {
    this.service = service;
  }

  @GetMapping("/providers")
  List<Provider> providers() {
    return service.providers();
  }

  @GetMapping("/accounts")
  Snapshot accounts() {
    return service.snapshot();
  }

  @PostMapping("/accounts")
  @ResponseStatus(HttpStatus.CREATED)
  Snapshot add(@RequestBody AddRequest request) {
    return service.add(request);
  }

  @DeleteMapping("/accounts/{id}")
  Snapshot remove(@PathVariable String id) {
    return service.remove(id);
  }

  @PutMapping("/accounts/{id}/statement")
  Snapshot upload(@PathVariable String id, @RequestBody UploadRequest request) {
    return service.upload(id, request);
  }

  @PostMapping("/submissions")
  @ResponseStatus(HttpStatus.CREATED)
  Receipt submit() {
    return service.submit();
  }
}
