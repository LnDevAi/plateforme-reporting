package com.reporting.backend.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class TemplatesController {
	@GetMapping("/api/templates")
	public List<Map<String,Object>> list(){
		return List.of(
			Map.of("id","plat-bud-elab","name","Budget prévisionnel (Plateforme)","session","budgetaire","phase","elaboration"),
			Map.of("id","plat-pta-elab","name","PTA (Plateforme)","session","budgetaire","phase","elaboration"),
			Map.of("id","plat-ppm-elab","name","PPM (Plateforme)","session","budgetaire","phase","elaboration"),
			Map.of("id","plat-close-ca","name","ODJ - Arrêt des comptes (Plateforme)","session","cloture","phase","elaboration")
		);
	}

	@GetMapping("/api/templates/{id}")
	public Map<String,Object> detail(@PathVariable String id){
		String content = switch (id) {
			case "plat-bud-elab" -> "# Modèle Budget\n- Recettes\n- Dépenses\n- Hypothèses";
			case "plat-pta-elab" -> "# Modèle PTA\n- Objectifs\n- Activités\n- Jalons";
			case "plat-ppm-elab" -> "# Modèle PPM\n- Lignes d'achat\n- Procédures\n- Calendrier";
			default -> "# Modèle " + id + "\nContenu à compléter";
		};
		return Map.of(
			"id", id,
			"format", "markdown",
			"content", content
		);
	}
}