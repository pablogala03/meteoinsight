package com.meteoinsight.backend.controller;

import com.meteoinsight.backend.dto.StationDTO;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/station")
@CrossOrigin(origins = "http://localhost:5173")
public class StationController {

    @GetMapping
    public StationDTO getStation() {
        return new StationDTO(
                "MeteoInsight Station",
                "Galaroza, Huelva",
                37.926,
                -6.712
        );
    }
}