package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	@PostMapping("/login")
	public Map<String,Object> login(@RequestBody Map<String,Object> body){
		String email = String.valueOf(body.getOrDefault("email","demo@local"));
		String token = UUID.randomUUID().toString();
		Map<String,Object> user = DataStore.users.values().stream().findFirst().orElse(Map.of());
		return Map.of("token", token, "user", user);
	}

	@GetMapping("/me")
	public Map<String,Object> me(){
		return DataStore.users.values().stream().findFirst().orElse(Map.of());
	}
}