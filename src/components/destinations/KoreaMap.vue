<template>
  <div id="container" ref="mapContainer"></div>
</template>

<script>
export default {
  name: 'KoreaMap',
  mounted() {
    this.loadMap();
  },
  methods: {
    async loadMap() {
      try {
        const response = await fetch('/assets/koreaMaps/korea.json');
        const koreaData = await response.json();
        this.drawMap(this.$refs.mapContainer, koreaData);
      } catch (error) {
        console.error('지도 데이터를 불러오는 데 실패했습니다:', error);
      }
    },

    drawMap(target, koreaData) {
      const d3 = window.d3;
      if (!d3) {
        console.error('d3가 로드되지 않았습니다.');
        return;
      }

      const width = 1000;
      const height = 1000;
      const koreaCenter = [127.7, 36.2];
      const initialScale = 7000;

      const projection = d3.geo.mercator()
        .center(koreaCenter)
        .scale(initialScale)
        .translate([width / 2, height / 2]);

      const path = d3.geo.path().projection(projection);

      const zoom = d3.behavior
        .zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([height, 800 * height])
        .on('zoom', zoomed);

      const svg = d3
        .select(target)
        .append('svg')
        .attr('width', `${width}px`)
        .attr('height', `${height}px`)
        .attr('id', 'map');

      const states = svg.append('g').attr('id', 'states').call(zoom);

      // 배경
      states.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#ffffff');

      let activeRegion = null;

      const colorScale = d3.scale.ordinal()
        .domain(koreaData.features.map(d => d.properties.name_eng))
        .range([
          '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
          '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
          '#6b9ac4', '#d7b5a6', '#668f80', '#e6a0c4', '#c6cdf7',
          '#8cd17d', '#b6992d'
        ]);

      const resetAllRegions = () => {
        if (activeRegion !== null) {
          states.selectAll('path')
            .transition()
            .duration(300)
            .style('opacity', 1)
            .attr('transform', 'translate(0, 0) scale(1)')
            .style('filter', 'none')
            .style('z-index', 1);
          
          states.selectAll('text')
            .transition()
            .duration(300)
            .attr('transform', translateTolabel)
            .style('font-weight', 'normal')
            .style('font-size', '12px');

          activeRegion = null;
        }
      };

      // 경계 path는 단순 렌더만
      states.selectAll('path')
        .data(koreaData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', d => `path-${d.properties.name_eng}`)
        .attr('fill', d => colorScale(d.properties.name_eng))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('transition', 'all 0.3s ease');

      // 지역 라벨 추가 + hover 로직
      const labels = states.selectAll('text')
        .data(koreaData.features)
        .enter()
        .append('text')
        .attr('transform', translateTolabel)
        .attr('id', d => `label-${d.properties.name_eng}`)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', '12px')
        .attr('fill', '#ffffff')
        .style('cursor', 'pointer')
        .style('text-shadow', '0 0 3px rgba(0,0,0,0.5)')
        .text(d => d.properties.name)
        .on('mouseover', function (d) {
          resetAllRegions();
          activeRegion = d.properties.name_eng;

          // 다른 지역 흐리게
          states.selectAll('path')
            .transition()
            .duration(300)
            .style('opacity', 0.7);

          // 해당 지역 강조
          d3.select(`#path-${d.properties.name_eng}`)
            .transition()
            .duration(300)
            .style('opacity', 1)
            .attr('transform', 'scale(1.05)')
            .style('filter', 'drop-shadow(0 3px 3px rgba(0,0,0,0.2))')
            .style('z-index', 10);

          // 라벨 강조
          d3.select(this)
            .transition()
            .duration(300)
            .attr('transform', () => {
              const centroid = path.centroid(d);
              return `translate(${centroid[0]}, ${centroid[1]})`;
            })
            .style('font-weight', 'bold')
            .style('font-size', '14px');
        })
        .on('mouseout', function () {
          resetAllRegions();
        });

      svg.on('mouseleave', resetAllRegions);

      function translateTolabel(d) {
        const arr = path.centroid(d);
        if (d.properties.code === 31) arr[1] += 20;
        else if (d.properties.code === 34) arr[1] += 10;
        return `translate(${arr})`;
      }

      function zoomed() {
        projection.translate(d3.event.translate).scale(d3.event.scale);
        states.selectAll('path').attr('d', path);
        labels.attr('transform', translateTolabel);
      }
    },
  },
};
</script>
