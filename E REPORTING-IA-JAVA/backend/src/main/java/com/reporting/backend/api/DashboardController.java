package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
	@GetMapping("/stats")
	public Map<String,Object> stats(@RequestParam Optional<String> ministryId, @RequestParam Optional<String> entityId){
		int base = 100;
		if (entityId.isPresent()) base = 25;
		else if (ministryId.isPresent()) base = 60;
		return Map.of(
			"reportsCompleted", base,
			"reportsPending", 100-base
		);
	}

	@GetMapping("/kpis")
	public List<Map<String,Object>> kpis(@RequestParam Optional<String> ministryId, @RequestParam Optional<String> entityId){
		double factor = entityId.isPresent() ? 0.3 : ministryId.isPresent() ? 0.6 : 1.0;
		return List.of(
			Map.of("area","Budget","executionRate", Math.round(75*factor)),
			Map.of("area","PPM","compliance", Math.round(82*factor)),
			Map.of("area","RH","hiringRate", Math.round(67*factor)),
			Map.of("area","Trésorerie","liquidityDays", Math.round(45*factor)),
			Map.of("area","Gouvernance","auditsClosed", Math.round(12*factor))
		);
	}
}