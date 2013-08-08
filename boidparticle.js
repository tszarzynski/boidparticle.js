      /**
       * Particle implementation with several types of behaviour.
       *
       * @see https://github.com/tszarzynski/point.js
       */


      BoidParticle.prototype.type = null;
      BoidParticle.prototype.position = null;
      BoidParticle.prototype.oldPosition = null;
      BoidParticle.prototype.velocity = null;
      BoidParticle.prototype.steeringForce = null;
      BoidParticle.prototype.acceleration = null;
      BoidParticle.prototype.scale = 1.0;

      BoidParticle.prototype.maxSpeed = 6.0;
      BoidParticle.prototype.maxForce = 6.0;
      BoidParticle.prototype.matrix = null;
      BoidParticle.prototype.wanderTheta = 0.0;
      BoidParticle.prototype.wanderTheta = 16.0;
      BoidParticle.prototype.wanderDistance = 100.0;
      BoidParticle.prototype.wanderStep = 0.25;
      BoidParticle.prototype.distance = null;
      BoidParticle.prototype.boundsCentre = 1.0;
      BoidParticle.prototype.boundsRadius = 100;
      BoidParticle.prototype.radius = 0.0;



      function BoidParticle() {
        this.matrix = new Matrix();
        this.boundsCentre = new Point(0, 0);

        this.reset();
      }

      /*
       * Updates particle state based on applied behaviours
       */
      BoidParticle.prototype.update = function() {
        this.oldPosition = this.position;

        this.velocity = this.velocity.add(this.acceleration);

        if (this.velocity.length() * this.velocity.length() > this.maxSpeed * this.maxSpeed) {
          this.velocity.normalize(this.maxSpeed);
        }

        this.position = this.position.add(this.velocity);

        this.acceleration.x = 0;
        this.acceleration.y = 0;

        if (!this.position.equals(this.oldPosition)) {
          var distance = Point.distance(this.position, this.boundsCentre);

          if (distance > this.boundsRadius + this.radius) {
            this.position = this.position.subtract(this.boundsCentre);
            this.position.normalize(1);
            this.position.x *= (this.boundsRadius + this.radius);
            this.position.y *= (this.boundsRadius + this.radius);

            this.velocity.x *= (-1);
            this.velocity.y *= (-1);
            this.position = this.position.add(this.velocity);
            this.position = this.position.add(this.boundsCentre);
          }
        }

        this.matrix.identity();
        this.matrix.scale(this.scale, this.scale);

        this.matrix.rotate(Math.atan2(this.velocity.y, this.velocity.x));
        this.matrix.translate(this.position.x, this.position.y);
      };

      /**
       * Seek towards a defined point
       */
      BoidParticle.prototype.seek = function(target /* Point */ , multiplier) {
        multiplier = typeof multiplier !== 'undefined' ? multiplier : 1.0;

        this.steeringForce = this.steer(target);

        if (multiplier != 1.0) {
          this.steeringForce.x *= (multiplier);
          this.steeringForce.y *= (multiplier);
        }

        this.acceleration = this.acceleration.add(this.steeringForce);
      };

      /**
       * Go to defined point with optional easing
       */
      BoidParticle.prototype.arrive = function(target /* Point */ , easeDistance, multiplier) {
        easeDistance = typeof easeDistance !== 'undefined' ? easeDistance : 100;
        multiplier = typeof multiplier !== 'undefined' ? multiplier : 1.0;

        this.steeringForce = steer(target, true, easeDistance);

        if (multiplier != 1.0) {
          this.steeringForce.x *= (multiplier);
          this.steeringForce.y *= (multiplier);
        }

        this.acceleration = this.acceleration.add(this.steeringForce);
      };

      /**
       * Wander around
       */
      BoidParticle.prototype.wander = function(multiplier) {
        multiplier = typeof multiplier !== 'undefined' ? multiplier : 1.0;

        this.wanderTheta += Math.random() * this.wanderStep;

        if (Math.random() < 0.5) {
          this.wanderTheta = -this.wanderTheta;
        }

        var pos = this.velocity.clone();

        pos.normalize(1);
        pos.x *= (this.wanderDistance);
        pos.y *= (this.wanderDistance);
        pos = pos.add(this.position);

        var offset = new Point();

        // was cos
        offset.x = this.wanderRadius * Math.sin(this.wanderTheta);
        offset.y = this.wanderRadius * Math.cos(this.wanderTheta);

        this.steeringForce = this.steer(pos.add(offset));

        if (multiplier != 1.0) {
          this.steeringForce.x *= (multiplier);
          this.steeringForce.y *= (multiplier);
        }

        this.acceleration = this.acceleration.add(this.steeringForce);
      };

      /**
       * Flee away from defined point.
       */
      BoidParticle.prototype.flee = function(target /* Point */ , panicDistance, multiplier) {
        panicDistance = typeof panicDistance !== 'undefined' ? panicDistance : 100;
        multiplier = typeof multiplier !== 'undefined' ? multiplier : 1.0;


        if (!target) return;

        this.distance = Point.distance(this.position, target);

        if (this.distance > panicDistance) {
          return;
        }

        this.steeringForce = this.steer(target, true, -panicDistance);

        if (multiplier != 1.0) {
          this.steeringForce.x *= (multiplier);
          this.steeringForce.y *= (multiplier);
        }

        this.steeringForce.x *= -1;
        this.steeringForce.y *= -1;
        this.acceleration = this.acceleration.add(this.steeringForce);
      };

      /**
       * Go in defined direction
       */
      BoidParticle.prototype.steer = function(target /* Point */ , ease, easeDistance) {
        ease = typeof ease !== 'undefined' ? ease : false;
        easeDistance = typeof easeDistance !== 'undefined' ? easeDistance : 100;


        this.steeringForce = target.clone();
        this.steeringForce = this.steeringForce.subtract(this.position);
        this.steeringForce.normalize(1);

        this.distance = this.steeringForce.length;

        if (this.distance > 0.00001) {
          if (this.distance < easeDistance && ease) {
            this.steeringForce.x *= (this.maxSpeed * (this.distance / easeDistance));
            this.steeringForce.y *= (this.maxSpeed * (this.distance / easeDistance));
          } else {
            this.steeringForce.x *= (this.maxSpeed);
            this.steeringForce.y *= (this.maxSpeed);
          }

          this.steeringForce = this.steeringForce.subtract(this.velocity);

          if (this.velocity.length * this.velocity.length > this.maxForce * this.maxForce) {
            this.steeringForce.normalize(this.maxForce);
          }
        }

        return this.steeringForce;
      };



      BoidParticle.prototype.reset = function() {
        this.velocity = new Point();
        this.position = new Point();
        this.oldPosition = new Point();
        this.acceleration = new Point();
        this.steeringForce = new Point();
      }