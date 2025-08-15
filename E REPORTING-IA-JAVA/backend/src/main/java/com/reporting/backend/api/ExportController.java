package com.reporting.backend.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/export")
public class ExportController {
	@GetMapping(value = "/kpis.csv", produces = "text/csv")
	public ResponseEntity<String> exportKpisCsv(){
		StringBuilder sb = new StringBuilder();
		sb.append("area,metric,value\n");
		sb.append("Budget,executionRate,75\n");
		sb.append("PPM,compliance,82\n");
		sb.append("RH,hiringRate,67\n");
		sb.append("Trésorerie,liquidityDays,45\n");
		sb.append("Gouvernance,auditsClosed,12\n");
		return ResponseEntity.ok()
			.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dashboard_kpis.csv")
			.contentType(MediaType.parseMediaType("text/csv"))
			.body(sb.toString());
	}
}