package com.reporting.backend.api;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/signatures")
public class SignaturesController {
	@PostMapping("/mock")
	public Map<String,Object> sign(@RequestBody Map<String,Object> body){
		String documentId = String.valueOf(body.get("documentId"));
		String signedBy = String.valueOf(body.getOrDefault("signedBy","Admin"));
		Map<String,Object> doc = com.reporting.backend.api.DocumentsController.documents.get(documentId);
		if (doc == null) return Map.of("ok", false, "message", "Document introuvable");
		Map<String,Object> signature = Map.of(
			"signed", true,
			"signedBy", signedBy,
			"signedAt", new Date().toString()
		);
		doc.put("signature", signature);
		return Map.of("ok", true, "document", doc);
	}
}