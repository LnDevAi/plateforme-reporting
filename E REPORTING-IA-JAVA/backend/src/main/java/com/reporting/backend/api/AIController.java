package com.reporting.backend.api;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {
	@PostMapping("/assist")
	public Map<String,Object> assist(@RequestBody Map<String,Object> body){
		String prompt = String.valueOf(body.getOrDefault("prompt",""));
		return Map.of(
			"prompt", prompt,
			"suggestion", "Analyse initiale: proposez un plan de rapport (Budget, PPM, RH, Audit).",
			"sections", List.of("Budget","PPM","RH","Audit")
		);
	}
}