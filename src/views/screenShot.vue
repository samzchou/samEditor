<template>
  <div class="screenshot-container">
    <div ref="screenshotArea" class="screenshot-area" @mousedown="startSelection" @mousemove="updateSelection" @mouseup="endSelection">
      <!-- 这里放置你要截图的内容 -->
      <p>这是你要截图的内容</p>
    </div>
    <div v-if="isDragging" class="selection-rect" :style="selectionStyle"></div>
    <button @click="takeScreenshot">截图</button>
    <div v-if="screenshotImage" class="screenshot-preview">
      <img :src="screenshotImage" alt="截图" />
    </div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';

export default {
  data() {
    return {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      screenshotImage: null,
    };
  },
  computed: {
    selectionStyle() {
      const width = this.currentX - this.startX;
      const height = this.currentY - this.startY;
      return {
        left: `${this.startX}px`,
        top: `${this.startY}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    },
  },
  methods: {
    startSelection(event) {
      this.isDragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
    },
    updateSelection(event) {
      if (this.isDragging) {
        this.currentX = event.clientX;
        this.currentY = event.clientY;
      }
    },
    endSelection() {
      this.isDragging = false;
    },
    async takeScreenshot() {
      const screenshotArea = this.$refs.screenshotArea;
      const rect = screenshotArea.getBoundingClientRect();
      const areaX = rect.left;
      const areaY = rect.top;

      const selectionRect = {
        left: this.startX - areaX,
        top: this.startY - areaY,
        width: this.currentX - this.startX,
        height: this.currentY - this.startY,
      };

      const canvas = await html2canvas(screenshotArea);
      const imgData = canvas.toDataURL('image/png');

      // Create a new canvas for the selected area
      const selectionCanvas = document.createElement('canvas');
      selectionCanvas.width = selectionRect.width;
      selectionCanvas.height = selectionRect.height;
      const ctx = selectionCanvas.getContext('2d');
      const img = new Image();
      img.src = imgData;
      img.onload = () => {
        ctx.drawImage(
          img,
          selectionRect.left,
          selectionRect.top,
          selectionRect.width,
          selectionRect.height,
          0,
          0,
          selectionRect.width,
          selectionRect.height
        );
        this.screenshotImage = selectionCanvas.toDataURL('image/png');
		
		console.log('this.screenshotImage==>', this.screenshotImage)
      };
    },
  },
};
</script>

<style>
.screenshot-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

button{
	position: absolute;
  top: 20px;
  left: 100px;
  z-index:100;
}

.screenshot-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
    align-items: center;
    justify-content: center;
}

.selection-rect {
  position: absolute;
  border: 2px dashed blue;
  pointer-events: none;
}

.screenshot-preview {
  margin-top: 20px;
}
</style>